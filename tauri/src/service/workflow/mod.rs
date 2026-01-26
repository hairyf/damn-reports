pub mod status;
pub mod utils;

use crate::config::{self};
use crate::service::download;
use crate::service::workflow::utils::{is_n8n_running, is_port_in_use, spawn_output_readers};
use std::process::{Command, Stdio};
use tauri;
use tauri::Manager;

/// 检测并启动 n8n 服务
pub async fn start(app_handle: tauri::AppHandle) -> Result<(), String> {
    let setting = config::get_store_dat_setting(&app_handle);
    if !setting.installed {
        log::debug!("n8n not installed, skipping startup");
        return Ok(());
    }

    log::debug!("Checking n8n running status");
    let port_in_use = is_port_in_use(config::N8N_PORT);
    let n8n_running = is_n8n_running().await;

    if port_in_use && n8n_running {
        log::info!("n8n is already running");
        status::set_status(status::Status::Running);
        status::emit_status(&app_handle);
        return Ok(());
    }

    log::info!("Starting n8n service");
    status::set_status(status::Status::Starting);
    status::emit_status(&app_handle);
    launch(app_handle).await?;
    // 之后由 scheduler/task/tick_check_n8n_process/mod.rs 检测状态

    Ok(())
}

/// 重启 n8n 服务
pub async fn restart(app_handle: tauri::AppHandle) -> Result<(), String> {
  log::info!("Restarting n8n service");
  
  // 1. 停止现有服务
  stop(app_handle.clone()).await?;
  
  // 2. 稍微等待一下确保端口释放（可选，通常 500ms 足够）
  tokio::time::sleep(std::time::Duration::from_millis(800)).await;
  
  // 3. 重新启动
  start(app_handle).await?;
  
  Ok(())
}

/// 启动 n8n 服务
pub async fn launch(app_handle: tauri::AppHandle) -> Result<(), String> {
  let node_binary_path = config::get_node_binary_path(&app_handle);
  let n8n_binary_path = config::get_n8n_binary_path(&app_handle);
  let n8n_data_path = config::get_n8n_data_path(&app_handle);

  log::debug!("Checking Node.js path: {:?}", node_binary_path);
  if !node_binary_path.exists() {
      log::error!("Node.js not installed");
      return Err("NODE_NOT_FOUND: Node.js not installed".to_string());
  }
  log::debug!("Checking n8n path: {:?}", n8n_binary_path);
  if !n8n_binary_path.exists() {
      log::error!("n8n not installed");
      return Err("N8N_NOT_FOUND: n8n not installed".to_string());
  }

  #[cfg(unix)]
  {
      let _ = Command::new("pkill").arg("-9").arg("node").output();
  }

  let mut cmd = Command::new(&node_binary_path);
  cmd.arg(&n8n_binary_path)
      .arg("start")
      .env("N8N_USER_FOLDER", n8n_data_path.to_str().unwrap())
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

  log::info!("Starting n8n process");
  match cmd.spawn() {
      Ok(mut child) => {
          log::info!("N8N process started successfully");
          // 获取 stdout 和 stderr，并启动读取线程
          let stdout = child.stdout.take();
          let stderr = child.stderr.take();
          spawn_output_readers(stdout, stderr);

          Ok(())
      }
      Err(e) => {
          log::error!("Failed to start process: {}", e);
          Err(format!("Failed to start process: {}", e))
      }
  }
}


/// 停止 n8n 服务
pub async fn stop(app_handle: tauri::AppHandle) -> Result<(), String> {
  log::info!("Stopping n8n service...");
  status::set_status(status::Status::Stopped);
  status::emit_status(&app_handle);

  let port = config::N8N_PORT;

  #[cfg(unix)]
  {
      // Unix/macOS: 使用 lsof 找到 PID 并 kill
      // -t 仅返回 PID，-i:{port} 指定端口
      let shell_cmd = format!("lsof -ti:{} | xargs kill -9", port);
      let output = Command::new("sh")
          .arg("-c")
          .arg(&shell_cmd)
          .output();
          
      match output {
          Ok(_) => log::info!("Unix: Port {} cleared", port),
          Err(e) => log::error!("Failed to execute kill command: {}", e),
      }
  }

  #[cfg(windows)]
  {
      // Windows: 使用 netstat 找到 PID 并用 taskkill 结束
      let shell_cmd = format!(
          "for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :{}') do taskkill /f /pid %a",
          port
      );
      let output = Command::new("cmd")
          .args(["/C", &shell_cmd])
          .output();

      match output {
          Ok(_) => log::info!("Windows: Port {} cleared", port),
          Err(e) => log::error!("Failed to execute taskkill: {}", e),
      }
  }

  log::info!("n8n stop command executed");
  Ok(())
}

/// 安装环境
pub async fn install(app_handle: &tauri::AppHandle) -> Result<(), String> {
    log::info!("Starting installation process");
    let window = app_handle
        .get_webview_window("main")
        .ok_or("Failed to get main window")?;
    log::debug!("Main window obtained");
    let mut tracker = download::ProgressTracker::new(&window, 4);
    let tasks: Vec<Box<dyn download::Installable>> =
        vec![Box::new(download::Nodejs), Box::new(download::N8n)];
    log::info!("Task list created, {} tasks total", tasks.len());

    for (index, task) in tasks.iter().enumerate() {
        log::debug!("Processing task {}/{}", index + 1, tasks.len());
        if task.check_installed(app_handle) {
            log::debug!("Task {} already installed, skipping", index + 1);
            tracker.skip_phases(2);
            continue;
        }

        log::info!("Task {} not installed, starting installation", index + 1);

        // 2. 下载
        tracker.start_phase("download", &format!("正在下载 {}", task.title()));
        let url = task.get_download_url()?;
        log::debug!("Download URL: {}", url);
        let name = url.split('/').last().unwrap().to_string();
        log::debug!("File name: {}", name);
        let buffer = download::download_file(&tracker, url).await.unwrap();
        log::info!("Download completed, file size: {} bytes", buffer.len());
        tracker.end_phase();

        // 3. 解压
        tracker.start_phase("extract", &format!("正在解压 {}", task.title()));
        let dest = task.get_install_path(app_handle);
        log::debug!("Installation path: {:?}", dest);
        download::ensure_extract(&tracker, name, buffer, dest)?;
        log::info!("Extraction completed");
        tracker.end_phase();
    }

    log::info!("All installation tasks completed");
    tracker.update(
        100.0,
        format!("依赖已安装完毕"),
        "All tasks completed".into(),
    );

    Ok(())
}
