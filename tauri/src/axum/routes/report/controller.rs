use axum::{
  http::StatusCode,
  Json,
  extract::State,
};

use crate::axum::AppState;
use crate::axum::routes::report::dtos::ReportCreateInput;
use crate::axum::routes::report::service::create_report;
use crate::database::entities::report;

pub async fn post(
  State(state): State<AppState>,
  Json(input): Json<ReportCreateInput>
) -> (StatusCode, Json<report::Model>) {
  match create_report(state.db.clone(), input).await {
    Ok(report) => {
      // 发送通知
      use tauri_plugin_notification::NotificationExt;
      if let Err(e) = state.app_handle.notification()
        .builder()
        .title("报告已生成完毕")
        .body(&format!("报告 \"{}\" 已成功保存", report.name))
        .show() {
        eprintln!("发送通知失败: {}", e);
      }
      (StatusCode::OK, Json(report))
    }
    Err(e) => {
      eprintln!("Insert report failed: {}", e);
      (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(report::Model {
          id: 0,
          name: String::new(),
          r#type: String::new(),
          content: String::new(),
          created_at: String::new(),
          updated_at: String::new(),
          workspace_id: 0
        }),
      )
    }
  }
}

