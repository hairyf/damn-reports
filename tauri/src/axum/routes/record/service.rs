use chrono::{DateTime, Utc, Local, Datelike};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, QueryOrder};
use std::sync::Arc;
use serde_json::Value;

use crate::axum::routes::record::dtos::{RecordType, RecordWithSource};
use crate::database::entities::{prelude, record, source};

pub fn get_time_range(r#type: &RecordType) -> (DateTime<Utc>, DateTime<Utc>) {
  let now = Local::now();
  let date = now.date_naive();
  
  match r#type {
    RecordType::Daily => {
      let start = date.and_hms_opt(0, 0, 0).unwrap().and_local_timezone(Local).unwrap().with_timezone(&Utc);
      let end = date.and_hms_opt(23, 59, 59).unwrap().and_local_timezone(Local).unwrap().with_timezone(&Utc);
      (start, end)
    }
    RecordType::Weekly => {
      let days_from_monday = now.weekday().num_days_from_monday();
      let start_of_week = date - chrono::Duration::days(days_from_monday as i64);
      let start = start_of_week.and_hms_opt(0, 0, 0).unwrap().and_local_timezone(Local).unwrap().with_timezone(&Utc);
      let end_of_week = start_of_week + chrono::Duration::days(6);
      let end = end_of_week.and_hms_opt(23, 59, 59).unwrap().and_local_timezone(Local).unwrap().with_timezone(&Utc);
      (start, end)
    }
    RecordType::Monthly => {
      let start_date = date.with_day(1).unwrap();
      let start = start_date.and_hms_opt(0, 0, 0).unwrap().and_local_timezone(Local).unwrap().with_timezone(&Utc);
      
      // 计算月末日期：下个月的第一天减去一天
      let next_month = if date.month() == 12 {
        chrono::NaiveDate::from_ymd_opt(date.year() + 1, 1, 1).unwrap()
      } else {
        chrono::NaiveDate::from_ymd_opt(date.year(), date.month() + 1, 1).unwrap()
      };
      let end_date = next_month.pred_opt().unwrap();
      let end = end_date.and_hms_opt(23, 59, 59).unwrap().and_local_timezone(Local).unwrap().with_timezone(&Utc);
      (start, end)
    }
    RecordType::Yearly => {
      let start_date = chrono::NaiveDate::from_ymd_opt(date.year(), 1, 1).unwrap();
      let start = start_date.and_hms_opt(0, 0, 0).unwrap().and_local_timezone(Local).unwrap().with_timezone(&Utc);
      
      let end_date = chrono::NaiveDate::from_ymd_opt(date.year(), 12, 31).unwrap();
      let end = end_date.and_hms_opt(23, 59, 59).unwrap().and_local_timezone(Local).unwrap().with_timezone(&Utc);
      (start, end)
    }
  }
}

pub async fn get_records(
  db: Arc<DatabaseConnection>,
  r#type: &RecordType,
  workspace_id: Option<String>,
) -> Result<Vec<RecordWithSource>, sea_orm::DbErr> {
  // 计算时间范围
  let (start_time, end_time) = get_time_range(r#type);
  let start_iso = start_time.to_rfc3339();
  let end_iso = end_time.to_rfc3339();

  // 查询记录，并关联 source
  let mut query = prelude::Record::find()
    .filter(record::Column::CreatedAt.gte(start_iso.clone()))
    .filter(record::Column::CreatedAt.lte(end_iso.clone()));

  // 如果提供了 workspace_id，则过滤
  if let Some(ws_id_str) = workspace_id {
    if !ws_id_str.is_empty() {
      if let Ok(ws_id) = ws_id_str.parse::<i32>() {
        query = query.filter(record::Column::WorkspaceId.eq(ws_id));
      }
    }
  }

  let records = query
    .order_by_desc(record::Column::CreatedAt)
    .find_with_related(source::Entity)
    .all(&*db)
    .await?;

  // 将查询结果转换为 RecordWithSource
  let result: Vec<RecordWithSource> = records
    .into_iter()
    .filter_map(|(record, sources)| {
      // 获取关联的 source（应该只有一个）
      sources.first().and_then(|source| {
        // 解析 JSON 字符串为对象
        let parsed_data: Value = serde_json::from_str(&record.data)
          .unwrap_or_else(|_| Value::Null); // 如果解析失败，使用 Null
        
        Some(RecordWithSource {
          id: record.id,
          summary: record.summary,
          data: parsed_data,
          created_at: record.created_at,
          updated_at: record.updated_at,
          source_id: record.source_id,
          workspace_id: record.workspace_id,
          source_name: source.name.clone(),
          source: source.r#type.clone(),
        })
      })
    })
    .collect();

  Ok(result)
}
