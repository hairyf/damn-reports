use axum::{
  http::StatusCode,
  Json,
  extract::{Query, State},
};

use crate::axum::AppState;
use crate::axum::routes::record::dtos::{GetRecordsParams, RecordWithSource};
use crate::axum::routes::record::service::get_records;

pub async fn get(
  State(state): State<AppState>,
  params: Query<GetRecordsParams>
) -> (StatusCode, Json<Vec<RecordWithSource>>) {
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

