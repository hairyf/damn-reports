use chrono::{DateTime, Utc, Local, Datelike};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, QueryOrder};
use std::sync::Arc;

use crate::axum::routes::record::dtos::RecordType;
use crate::database::entities::{prelude, record};

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
) -> Result<Vec<record::Model>, sea_orm::DbErr> {
  // 计算时间范围
  let (start_time, end_time) = get_time_range(r#type);
  let start_iso = start_time.to_rfc3339();
  let end_iso = end_time.to_rfc3339();

  // 查询记录
  let records = prelude::Record::find()
    .filter(record::Column::CreatedAt.gte(start_iso.clone()))
    .filter(record::Column::CreatedAt.lte(end_iso.clone()))
    .order_by_desc(record::Column::CreatedAt)
    .all(&*db)
    .await?;

  Ok(records)
}
