use axum::{
  http::StatusCode,
  Json,
  extract::{Query, State},
  response::Response,
  body::Body,
};
use serde_json;

use crate::bridge::server::AppState;
use crate::bridge::server::routes::record::dtos::{GetRecordsParams, GroupedRecordsResponse};
use crate::bridge::server::routes::record::service::{get_records, get_summary_prompt};
use crate::task;

pub async fn post_collect(
  State(state): State<AppState>
) -> (StatusCode, Json<serde_json::Value>) {
  let db_clone = (*state.db).clone();
  // 在后台执行收集任务，避免阻塞 HTTP 请求
  tokio::spawn(async move {
    match task::collect_records_of_source::trigger(db_clone).await {
      Ok(count) => {
        log::info!("Background collect task completed successfully, collected {} records", count);
      }
      Err(e) => {
        log::error!("Background collect task failed: {}", e);
      }
    }
  });
  
  // 立即返回，表示任务已启动
  (StatusCode::ACCEPTED, Json(serde_json::json!({
    "message": "Collect task started",
    "status": "accepted"
  })))
}

pub async fn get(
  State(state): State<AppState>,
  params: Query<GetRecordsParams>
) -> (StatusCode, Json<Vec<GroupedRecordsResponse>>) {
  match get_records(state.db.clone(), &params.r#type, params.workspace_id.clone()).await {
    Ok(records) => {
      (StatusCode::OK, Json(records))
    }
    Err(e) => {
      log::error!("Get Records Error: {}", e);
      (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
    }
  }
}

pub async fn get_summary(
  State(state): State<AppState>,
  params: Query<GetRecordsParams>
) -> Result<Response<Body>, StatusCode> {
  match get_summary_prompt(state.db.clone(), &params.r#type, params.workspace_id.clone()).await {
    Ok(prompt) => {
      Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "text/plain; charset=utf-8")
        .body(Body::from(prompt))
        .unwrap())
    }
    Err(e) => {
      log::error!("Get Summary Error: {}", e);
      Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
  }
}
