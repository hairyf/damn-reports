use axum::{
  http::StatusCode,
  Json,
  extract::{Query, State},
};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::axum::modules::record::dtos::GetRecordsParams;
use crate::axum::modules::record::service::get_records;
use crate::database::entities::record;

pub async fn get(
  State(db): State<Arc<DatabaseConnection>>,
  params: Query<GetRecordsParams>
) -> (StatusCode, Json<Vec<record::Model>>) {
  match get_records(db, &params.r#type).await {
    Ok(records) => {
      (StatusCode::OK, Json(records))
    }
    Err(e) => {
      eprintln!("查询失败: {}", e);
      (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![]))
    }
  }
}

