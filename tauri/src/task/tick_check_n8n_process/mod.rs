use crate::service::workflow::{
    status::{self, Status},
    utils as workflow_utils,
};
use tauri::AppHandle;


/// 检测 n8n 进程状态并更新
///
/// 同时使用端口检测和 HTTP 请求检测：
/// 1. 先检测 N8N_PORT 端口是否被占用（快速检测）
/// 2. 如果端口被占用，再检测 n8n REST API 是否返回正常
/// 只有两个条件都满足时，才认为 n8n 真正在运行
pub async fn trigger(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let current_status = status::get_status();

    // 先快速检测端口
    let is_n8n_running = workflow_utils::is_n8n_running().await;
    log::trace!(
        "N8N status check: n8n_running={}",
        is_n8n_running
    );

    // 只有当当前状态为运行中时，才更新状态
    if is_n8n_running && current_status != Status::Running {
        status::set_status(Status::Running);
        status::emit_status(&app_handle);
    }

    Ok(())
}
