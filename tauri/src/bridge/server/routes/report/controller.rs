use axum::{
  http::StatusCode,
  Json,
  extract::State,
};

use crate::bridge::server::AppState;
use crate::bridge::server::routes::report::dtos::ReportCreateInput;
use crate::bridge::server::routes::report::service::create_report;
use crate::core::db::entities::report;

pub async fn post(
  State(state): State<AppState>,
  Json(input): Json<ReportCreateInput>
) -> (StatusCode, Json<report::Model>) {
  match create_report(state.db.clone(), input).await {
    Ok(report) => {

      // 发送通知
      let app_handle = state.app_handle.clone();
      let report_name = report.name.clone();
      
      println!("Attempting to send notification for report: {}", report_name);
        
      // 发送通知
      use tauri_plugin_notification::NotificationExt;
      let notification_result = app_handle.notification()
        .builder()
        .title("Report Generated")
        .body(&format!("Report \"{}\" generated successfully", report_name))
        .show();
      
      match notification_result {
        Ok(_) => {
          println!("✓ Notification sent successfully for report: {}", report_name);
        }
        Err(e) => {
          eprintln!("✗ Failed to send notification: {:?}", e);
        }
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
