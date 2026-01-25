use std::sync::{Mutex, OnceLock};
use tauri::AppHandle;
use tauri::Emitter;

#[derive(Debug, Clone, serde::Serialize, PartialEq)]
pub enum Status {
    Initial,
    Installing,
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

pub fn emit_status(app_handle: &AppHandle) {
    let status = get_status();
    let _ = app_handle.emit("n8n-status-updated", &status);
}

pub fn get_status() -> Status {
    get_status_lock().lock().unwrap().clone()
}
