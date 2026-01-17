use axum::{
  http::StatusCode,
  Json,
  extract::State,
};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::axum::modules::report::dtos::ReportCreateInput;
use crate::axum::modules::report::service::create_report;
use crate::database::entities::report;

pub async fn post(
  State(db): State<Arc<DatabaseConnection>>,
  Json(input): Json<ReportCreateInput>
) -> (StatusCode, Json<report::Model>) {
  match create_report(db, input).await {
    Ok(report) => {
      (StatusCode::OK, Json(report))
    }
    Err(e) => {
      eprintln!("Insert report failed: {}", e);
      (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(report::Model {
          id: String::new(),
          name: String::new(),
          r#type: String::new(),
          content: String::new(),
          created_at: String::new(),
          updated_at: String::new(),
          workflow_id: String::new()
        }),
      )
    }
  }
}

