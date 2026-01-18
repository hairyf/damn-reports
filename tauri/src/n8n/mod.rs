pub mod status;
mod utils;

#[cfg(debug_assertions)]
mod start_n8n_dev;
#[cfg(not(debug_assertions))]
mod start_n8n_prod;

/// 启动 n8n 进程（根据编译环境自动选择 dev 或 prod）
pub fn start() {
    // 先检查 5678 端口是否已被占用（适用于生产和开发环境）
    if utils::is_port_in_use(5678) {
        // 端口已被占用，说明 n8n 可能已经在运行，直接设置状态为 Running
        status::set_status(status::Status::Running);
        return;
    }

    #[cfg(debug_assertions)]
    start_n8n_dev::start_n8n_dev();
    
    #[cfg(not(debug_assertions))]
    start_n8n_prod::start_n8n_prod();
}

