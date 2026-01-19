use axum::{
  http::StatusCode,
  Json,
  extract::{Query, State},
};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::axum::routes::record::dtos::{GetRecordsParams, RecordWithSource};
use crate::axum::routes::record::service::get_records;

pub async fn get(
  State(db): State<Arc<DatabaseConnection>>,
  params: Query<GetRecordsParams>
) -> (StatusCode, Json<Vec<RecordWithSource>>) {
  match get_records(db, &params.r#type, params.workspace_id.clone()).await {
    Ok(records) => {
      (StatusCode::OK, Json(records))
    }
    Err(e) => {
      eprintln!("Get Records Error: {}", e);
      (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
    }
  }
}

