pub mod status;
pub mod utils;

use crate::config;
use crate::services::download;
use std::fs;
use std::process::{Command, Stdio};
use tauri::Manager;
use tauri;
use crate::services::workflow::utils::{is_n8n_running, is_port_in_use};

pub async fn start(app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("[DEBUG] workflow::start: 开始启动工作流");
    let mut setting = config::get_store_dat_setting(&app_handle);
    dbg!(&setting.installed);

    if !setting.installed {
        println!("[DEBUG] workflow::start: 检测到未安装，开始安装流程");
        status::set_status(status::Status::Installing);
        install(&app_handle).await?;
        // 标记为已初始化
        setting.installed = true;
        config::set_store_dat_setting(&app_handle, setting);
        println!("[DEBUG] workflow::start: 安装完成，已标记为已安装");
    } else {
        println!("[DEBUG] workflow::start: 已安装，跳过安装步骤");
    }

    let port_in_use = is_port_in_use(config::N8N_PORT);
    let n8n_running = is_n8n_running().await;
    println!("[DEBUG] workflow::start: 端口 {} 使用状态: {}, n8n 运行状态: {}", config::N8N_PORT, port_in_use, n8n_running);

    if port_in_use && n8n_running {
        println!("[DEBUG] workflow::start: n8n 已在运行，直接返回");
        status::set_status(status::Status::Running);
        return Ok(());
    }

    println!("[DEBUG] workflow::start: 开始启动 n8n");
    status::set_status(status::Status::Starting);
    launch(app_handle).await?;
    println!("[DEBUG] workflow::start: n8n 启动命令已执行");
    // 之后由 scheduler/task/tick_check_n8n_process/mod.rs 检测状态

    Ok(())
}

async fn launch(app_handle: tauri::AppHandle) -> Result<(), String> {
    println!("[DEBUG] workflow::launch: 开始启动 n8n 进程");
    let get_node_binary_path = config::get_node_binary_path(&app_handle);
    let get_n8n_binary_path = config::get_n8n_binary_path(&app_handle);
    let get_n8n_data_path = config::get_n8n_data_path(&app_handle);

    println!("[DEBUG] workflow::launch: Node.js 路径: {:?}", get_node_binary_path);
    println!("[DEBUG] workflow::launch: n8n 路径: {:?}", get_n8n_binary_path);
    println!("[DEBUG] workflow::launch: n8n 数据路径: {:?}", get_n8n_data_path);

    if !get_node_binary_path.exists() {
        println!("[DEBUG] workflow::launch: 错误 - Node.js 未找到");
        return Err("NODE_NOT_FOUND: Node.js 未安装".to_string());
    }
    if !get_n8n_binary_path.exists() {
        println!("[DEBUG] workflow::launch: 错误 - n8n 未找到");
        return Err("N8N_NOT_FOUND: n8n 未安装".to_string());
    }

    #[cfg(unix)]
    {
        println!("[DEBUG] workflow::launch: Unix 系统，尝试清理现有 node 进程");
        let _ = Command::new("pkill").arg("-9").arg("node").output();
    }

    println!("[DEBUG] workflow::launch: 构建启动命令");
    let mut cmd = Command::new(&get_node_binary_path);
    cmd.arg(&get_n8n_binary_path)
        .arg("start")
        .env("N8N_USER_FOLDER", get_n8n_data_path.to_str().unwrap())
        // 关键环境变量：禁用交互模式
        .env("N8N_DISABLE_INTERACTIVE_REPL", "true")
        .env("N8N_BLOCK_IFRAME_EMBEDS", "false")
        .env("N8N_USE_SAMESITE_COOKIE_STRICT", "false")
        .env("N8N_CORS_ALLOWED_ORIGINS", "*")
        .env("N8N_SECURE_COOKIE", "false")
        .env("N8N_USER_MANAGEMENT_DISABLED", "true")
        .env("SKIP_SETUP", "true")
        .env("N8N_PORT", "5678")
        .env("N8N_HOST", "127.0.0.1")
        // 核心修正：提供一个空的 stdin 防止 setRawMode 报错
        .stdin(Stdio::null())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        println!("[DEBUG] workflow::launch: Windows 系统，设置创建标志");
        cmd.creation_flags(0x08000000);
    }

    println!("[DEBUG] workflow::launch: 执行 spawn 命令");
    match cmd.spawn() {
        Ok(child) => {
            println!("[DEBUG] workflow::launch: 进程启动成功，PID: {:?}", child.id());
            Ok(())
        }
        Err(e) => {
            println!("[DEBUG] workflow::launch: 进程启动失败: {}", e);
            Err(format!("进程启动失败: {}", e))
        }
    }
}

/// 安装 Node.js 和 n8n
async fn install(app_handle: &tauri::AppHandle) -> Result<(), String> {
    println!("[DEBUG] workflow::install: 开始安装流程");
    let window = app_handle
        .get_webview_window("main")
        .ok_or("无法获取主窗口")?;
    println!("[DEBUG] workflow::install: 已获取主窗口");
    let mut tracker = download::ProgressTracker::new(&window, 4);
    let tasks: Vec<Box<dyn download::Installable>> = vec![
        Box::new(download::Nodejs), 
        Box::new(download::N8n)
    ];
    println!("[DEBUG] workflow::install: 任务列表创建完成，共 {} 个任务", tasks.len());

    for (index, task) in tasks.iter().enumerate() {
        println!("[DEBUG] workflow::install: 处理任务 {}/{}", index + 1, tasks.len());
        if task.check_installed(app_handle) {
            println!("[DEBUG] workflow::install: 任务 {} 已安装，跳过", index + 1);
            tracker.skip_phases(2);
            continue;
        }

        println!("[DEBUG] workflow::install: 任务 {} 未安装，开始安装", index + 1);
        // 1. 清理并准备目录
        let temp_dir = task.get_temp_dir(app_handle);
        println!("[DEBUG] workflow::install: 临时目录: {:?}", temp_dir);
        if temp_dir.exists() {
            println!("[DEBUG] workflow::install: 清理现有临时目录");
            fs::remove_dir_all(&temp_dir).ok();
        }
        fs::create_dir_all(&temp_dir).map_err(|e| {
            println!("[DEBUG] workflow::install: 创建临时目录失败: {}", e);
            e.to_string()
        })?;
        println!("[DEBUG] workflow::install: 临时目录准备完成");

        // 2. 下载
        tracker.start_phase("download", &format!("正在下载 Node.js Binary"));
        let url = task.get_download_url()?;
        println!("[DEBUG] workflow::install: 下载 URL: {}", url);
        let name = url.split('/').last().unwrap().to_string();
        println!("[DEBUG] workflow::install: 文件名: {}", name);
        let buffer = download::download_file(&tracker, url).await.unwrap();
        println!("[DEBUG] workflow::install: 下载完成，文件大小: {} 字节", buffer.len());
        tracker.end_phase();

        // 3. 解压
        tracker.start_phase("extract", &format!("正在下载 Node.js Binary"));
        let dest = task.get_install_path(app_handle);
        println!("[DEBUG] workflow::install: 安装路径: {:?}", dest);
        download::ensure_extract(
            &tracker, 
            name, 
            buffer,
            dest
        )?;
        println!("[DEBUG] workflow::install: 解压完成");
        tracker.end_phase();
    }

    println!("[DEBUG] workflow::install: 所有安装任务完成");
    tracker.update(100.0, "所有任务已完成".into());

    Ok(())
}
