pub mod status;
pub mod utils;

use crate::config::{self};
use crate::services::download;
use std::process::{Command, Stdio, ChildStdout, ChildStderr};
use std::io::{BufRead, BufReader};
use std::thread;
use tauri::{Manager};
use tauri;
use crate::services::workflow::utils::{is_n8n_running, is_port_in_use};

pub async fn start(app_handle: tauri::AppHandle) -> Result<(), String> {
    let setting = config::get_store_dat_setting(&app_handle);
    if !setting.installed {
        return Ok(());
    }

    let port_in_use = is_port_in_use(config::N8N_PORT);
    let n8n_running = is_n8n_running().await;

    if port_in_use && n8n_running {
        status::set_status(status::Status::Running);
        status::emit_status(&app_handle);
        return Ok(());
    }

    status::set_status(status::Status::Starting);
    status::emit_status(&app_handle);
    launch(app_handle).await?;
    // 之后由 scheduler/task/tick_check_n8n_process/mod.rs 检测状态

    Ok(())
}

pub async fn launch(app_handle: tauri::AppHandle) -> Result<(), String> {
    let get_node_binary_path = config::get_node_binary_path(&app_handle);
    let get_n8n_binary_path = config::get_n8n_binary_path(&app_handle);
    let get_n8n_data_path = config::get_n8n_data_path(&app_handle);

    if !get_node_binary_path.exists() {
        return Err("NODE_NOT_FOUND: Node.js 未安装".to_string());
    }
    if !get_n8n_binary_path.exists() {
        return Err("N8N_NOT_FOUND: n8n 未安装".to_string());
    }

    #[cfg(unix)]
    {
        let _ = Command::new("pkill").arg("-9").arg("node").output();
    }

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
        // 使用管道捕获输出，以便在子线程中读取
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    match cmd.spawn() {
        Ok(mut child) => {
            // 获取 stdout 和 stderr，并启动读取线程
            let stdout = child.stdout.take();
            let stderr = child.stderr.take();
            spawn_output_readers(stdout, stderr);
            
            Ok(())
        }
        Err(e) => Err(format!("进程启动失败: {}", e))
    }
}

/// 安装 Node.js 和 n8n
pub async fn install(app_handle: &tauri::AppHandle) -> Result<(), String> {
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

        // 2. 下载
        tracker.start_phase("download", &format!("正在下载 {}", task.title()));
        let url = task.get_download_url()?;
        println!("[DEBUG] workflow::install: 下载 URL: {}", url);
        let name = url.split('/').last().unwrap().to_string();
        println!("[DEBUG] workflow::install: 文件名: {}", name);
        let buffer = download::download_file(&tracker, url).await.unwrap();
        println!("[DEBUG] workflow::install: 下载完成，文件大小: {} 字节", buffer.len());
        tracker.end_phase();

        // 3. 解压
        tracker.start_phase("extract", &format!("正在解压 {}", task.title()));
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

/// 在独立线程中读取子进程的输出
/// 
/// # 参数
/// - `stdout`: 子进程的标准输出
/// - `stderr`: 子进程的标准错误输出
fn spawn_output_readers(stdout: Option<ChildStdout>, stderr: Option<ChildStderr>) {
    // 在独立线程中读取 stdout
    if let Some(stdout) = stdout {
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    println!("[n8n stdout] {}", line);
                }
            }
        });
    }
    
    // 在独立线程中读取 stderr
    if let Some(stderr) = stderr {
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    eprintln!("[n8n stderr] {}", line);
                }
            }
        });
    }
}
