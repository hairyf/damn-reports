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
    let mut setting = config::get_store_dat_setting(&app_handle);

    if !setting.installed {
        status::set_status(status::Status::Installing);
        install(&app_handle).await?;
        // 标记为已初始化
        setting.installed = true;
        config::set_store_dat_setting(&app_handle, setting);
    }

    if is_port_in_use(config::N8N_PORT) && is_n8n_running().await {
        status::set_status(status::Status::Running);
        return Ok(());
    }

    status::set_status(status::Status::Starting);
    launch(app_handle).await?;
    // 之后由 scheduler/task/tick_check_n8n_process/mod.rs 检测状态

    Ok(())
}

async fn launch(app_handle: tauri::AppHandle) -> Result<(), String> {
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
    let _ = Command::new("pkill").arg("-9").arg("node").output();

    let mut cmd = Command::new(get_node_binary_path);
    cmd.arg(get_n8n_binary_path)
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
        cmd.creation_flags(0x08000000);
    }

    cmd.spawn().map_err(|e| format!("进程启动失败: {}", e))?;

    Ok(())
}

/// 安装 Node.js 和 n8n
async fn install(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let window = app_handle
        .get_webview_window("main")
        .ok_or("无法获取主窗口")?;
    let mut tracker = download::ProgressTracker::new(&window, 4);
    let tasks: Vec<Box<dyn download::Installable>> = vec![
        Box::new(download::Nodejs), 
        Box::new(download::N8n)
    ];

    for task in tasks {
        if task.check_installed(app_handle) {
            tracker.skip_phases(2);
            continue;
        }

        // 1. 清理并准备目录
        let temp_dir = task.get_temp_dir(app_handle);
        if temp_dir.exists() {
            fs::remove_dir_all(&temp_dir).ok();
        }
        fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

        // 2. 下载
        tracker.start_phase("download", &format!("正在下载 Node.js Binary"));
        let url = task.get_download_url()?;
        let name = url.split('/').last().unwrap().to_string();
        let buffer = download::download_file(&tracker, url).await.unwrap();
        tracker.end_phase();

        // 3. 解压
        tracker.start_phase("extract", &format!("正在下载 Node.js Binary"));
        let dest = task.get_install_path(app_handle);
        download::ensure_extract(
            &tracker, 
            name, 
            buffer,
            dest
        )?;
        tracker.end_phase();
    }

    tracker.update(100.0, "所有任务已完成".into());

    Ok(())
}
