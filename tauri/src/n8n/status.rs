use std::sync::{Mutex, OnceLock};

#[derive(Debug, Clone, serde::Serialize, PartialEq)]
pub enum Status {
    Initial,
    // only for production environment
    // Downloading,
    // Unzipping,
    Starting,
    Running,
}

// 使用静态变量在模块内部管理状态
static N8N_STATUS: OnceLock<Mutex<Status>> = OnceLock::new();

pub fn get_status_lock() -> &'static Mutex<Status> {
    N8N_STATUS.get_or_init(|| Mutex::new(Status::Initial))
}

pub fn set_status(status: Status) {
    *get_status_lock().lock().unwrap() = status;
}

pub fn get_status() -> Status {
    get_status_lock().lock().unwrap().clone()
}

