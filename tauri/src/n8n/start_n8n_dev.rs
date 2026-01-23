use crate::n8n::status;
use crate::n8n::utils;

/// 开发环境启动 n8n 进程
pub fn start_n8n_dev() {
    status::set_status(status::Status::Starting);

    if let Some(dir) = utils::get_n8n_process_dir() {
        match utils::spawn_npx_command(&dir, "n8n") {
            Ok(_) => {
                // 状态检测由 tick_check_n8n_process 任务处理
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
