use crate::services::workflow::{status::{self, Status}, utils};
use tauri::{AppHandle, Emitter};

impl Status {
  pub fn update_based_checks(
    &self, is_port_in_use: bool, is_http_ok: bool
  ) -> Self {
      // 只有端口被占用且 HTTP 请求正常返回 404 时，才认为真正运行中
      let is_running = is_port_in_use && is_http_ok;
      
      match (self, is_running) {
          // 无论当前是什么状态，只要两个检测都通过，就是运行中
          (_, true) => Status::Running,
          // 如果检测失败，但当前是启动中，则保持启动中（等待超时或成功）
          // (Status::Starting, false) => Status::Starting,
          // 其他情况（如原本运行中但检测失败），回退到初始状态
          _ => Status::Initial,
      }
  }
}
/// 检测 n8n 进程状态并更新
///
/// 同时使用端口检测和 HTTP 请求检测：
/// 1. 先检测 5678 端口是否被占用（快速检测）
/// 2. 如果端口被占用，再检测 http://localhost:5678/rest 是否返回 404
/// 只有两个条件都满足时，才认为 n8n 真正在运行
pub async fn trigger(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  let current_status = status::get_status();
  
  // 先快速检测端口
  let is_port_in_use = utils::is_port_in_use(5678);
  let is_http_ok = utils::is_n8n_running().await;
  let new_status = current_status.update_based_checks(is_port_in_use, is_http_ok);
  if new_status != current_status {
      println!("N8N status updated to: {:?}", new_status);
      status::set_status(new_status.clone());
      app_handle.emit("n8n-status-updated", &new_status)?;
  }
  Ok(())
}
