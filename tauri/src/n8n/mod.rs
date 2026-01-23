pub mod status;
pub mod utils;

#[cfg(debug_assertions)]
mod start_n8n_dev;
#[cfg(not(debug_assertions))]
mod start_n8n_prod;

/// 启动 n8n 进程（根据编译环境自动选择 dev 或 prod）
pub fn start() {
    #[cfg(debug_assertions)]
    start_n8n_dev::start_n8n_dev();
    
    #[cfg(not(debug_assertions))]
    start_n8n_prod::start_n8n_prod();
}

