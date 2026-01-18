use crate::n8n::status;
use crate::n8n::utils;
use std::thread;
use std::time::Duration;

/// 开发环境启动 n8n 进程
pub fn start_n8n_dev() {
    status::set_status(status::Status::Starting);

    if let Some(dir) = utils::get_n8n_process_dir() {
        match utils::spawn_npx_command(&dir, "n8n") {
            Ok(_) => {
                // 启动新线程轮询 5678 端口
                thread::spawn(move || {
                    const MAX_RETRIES: u32 = 1000; // 最多轮询 1000 次
                    const POLL_INTERVAL_MS: u64 = 1000; // 每 500ms 轮询一次
                    
                    for _ in 0..MAX_RETRIES {
                        if utils::is_port_in_use(5678) {
                            // 端口被占用，说明 n8n 已启动，设置为 Running
                            status::set_status(status::Status::Running);
                            return;
                        }
                        thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
                    }
                    
                    // 超时后仍未检测到端口被占用，保持 Starting 状态或设置为 Initial
                    eprintln!("Timeout waiting for n8n to start on port 5678");
                });
            }
            Err(e) => {
                eprintln!("Failed to spawn n8n process: {}", e);
                status::set_status(status::Status::Initial);
            }
        }
    } else {
        eprintln!("Could not find n8n-process directory.");
        status::set_status(status::Status::Initial);
    }
}
