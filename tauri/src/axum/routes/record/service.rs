use chrono::{DateTime, Utc, Local, Datelike};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, ColumnTrait, QueryOrder};
use std::sync::Arc;
use std::collections::HashMap;
use serde_json::Value;

use crate::axum::routes::record::dtos::{RecordType, GroupedRecordsResponse, SourceInfo, RecordItem};
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
) -> Result<Vec<GroupedRecordsResponse>, sea_orm::DbErr> {
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

  // 使用 HashMap 按 source_id 分组
  let mut grouped: HashMap<i32, (SourceInfo, Vec<RecordItem>)> = HashMap::new();

  for (record, sources) in records {
    if let Some(source) = sources.first() {
      // 解析 JSON 字符串为对象
      let parsed_data: Value = serde_json::from_str(&record.data)
        .unwrap_or_else(|_| Value::Null);

      // 创建 record 项
      let record_item = RecordItem {
        summary: record.summary,
        data: parsed_data,
      };

      // 按 source_id 分组，如果不存在则创建 source 信息
      grouped
        .entry(source.id)
        .or_insert_with(|| {
          (
            SourceInfo {
              name: source.name.clone(),
              r#type: source.r#type.clone(),
              description: source.description.clone(),
            },
            Vec::new(),
          )
        })
        .1
        .push(record_item);
    }
  }

  // 转换为响应格式
  let result: Vec<GroupedRecordsResponse> = grouped
    .into_iter()
    .map(|(_, (source, records))| GroupedRecordsResponse {
      source,
      records,
    })
    .collect();

  Ok(result)
}

pub async fn get_summary_prompt(
  db: Arc<DatabaseConnection>,
  r#type: &RecordType,
  workspace_id: Option<String>,
) -> Result<String, sea_orm::DbErr> {
  let grouped_records = get_records(db, r#type, workspace_id).await?;
  
  if grouped_records.is_empty() {
    return Ok(String::from("暂无记录数据。"));
  }

  let mut prompt = String::new();
  
  // 遍历每个 source 分组
  for (index, group) in grouped_records.iter().enumerate() {
    if index > 0 {
      prompt.push_str("\n");
    }
    
    prompt.push_str(&format!("{} ({})\n", 
      group.source.name, 
      group.source.r#type
    ));
    
    if !group.source.description.is_empty() {
      prompt.push_str(&format!("{}\n", group.source.description));
    }
    
    if group.records.is_empty() {
      continue;
    }
    
    // 添加记录列表
    for record in group.records.iter() {
      prompt.push_str(&format!("- {}\n", record.summary));
      
      // 根据不同的 source type 提取关键数据
      if let Value::Object(ref obj) = record.data {
        let extracted_data = extract_relevant_data(&group.source.r#type, obj);
        if !extracted_data.is_empty() {
          prompt.push_str(&format!("  {}\n", extracted_data));
        }
      }
    }
  }
  
  Ok(prompt)
}

/// 根据不同的 source type 提取关键数据字段
fn extract_relevant_data(source_type: &str, data: &serde_json::Map<String, Value>) -> String {
  match source_type.to_lowercase().as_str() {
    "git" => {
      let mut parts = Vec::new();
      
      // 提取文件变更统计
      if let Some(Value::Number(total_insertions)) = data.get("total_insertions") {
        if let Some(Value::Number(total_deletions)) = data.get("total_deletions") {
          parts.push(format!("变更: +{} -{}", total_insertions, total_deletions));
        }
      }
      
      // 提取文件列表（只显示路径和状态，不显示 patch）
      if let Some(Value::Array(files)) = data.get("files") {
        let file_info: Vec<String> = files
          .iter()
          .filter_map(|file| {
            if let Value::Object(file_obj) = file {
              let path = file_obj.get("path")?.as_str()?;
              let status = file_obj.get("status")?.as_str()?;
              Some(format!("{} ({})", path, status))
            } else {
              None
            }
          })
          .collect();
        
        if !file_info.is_empty() {
          parts.push(format!("文件: {}", file_info.join(", ")));
        }
      }
      
      parts.join(", ")
    }
    "clickup" => {
      let mut parts = Vec::new();
      
      // 提取状态
      if let Some(Value::Object(status_obj)) = data.get("status") {
        if let Some(Value::String(status)) = status_obj.get("status") {
          parts.push(format!("状态: {}", status));
        }
      }
      
      // 提取列表
      if let Some(Value::Object(list_obj)) = data.get("list") {
        if let Some(Value::String(list_name)) = list_obj.get("name") {
          parts.push(format!("列表: {}", list_name));
        }
      }
      
      parts.join(", ")
    }
    _ => {
      // 对于其他类型，返回空字符串（不显示 data）
      String::new()
    }
  }
}