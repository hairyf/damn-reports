use axum::{
  http::StatusCode,
  Json,
  extract::{Query, State},
  response::Response,
  body::Body,
};

use crate::axum::AppState;
use crate::axum::routes::record::dtos::{GetRecordsParams, GroupedRecordsResponse};
use crate::axum::routes::record::service::{get_records, get_summary_prompt};

pub async fn get(
  State(state): State<AppState>,
  params: Query<GetRecordsParams>
) -> (StatusCode, Json<Vec<GroupedRecordsResponse>>) {
  match get_records(state.db.clone(), &params.r#type, params.workspace_id.clone()).await {
    Ok(records) => {
      (StatusCode::OK, Json(records))
    }
    Err(e) => {
      eprintln!("Get Records Error: {}", e);
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
      eprintln!("Get Summary Error: {}", e);
      Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
  }
}
