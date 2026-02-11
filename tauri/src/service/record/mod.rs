//! 记录摘要生成，供 get_record_summary 等命令使用

use chrono::{DateTime, Datelike, Local, Utc};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;

use crate::core::db::entities::{prelude, record, source};

#[derive(Debug, Clone, Copy)]
#[allow(dead_code)]
pub enum RecordType {
    Daily,
    Weekly,
    Monthly,
    Yearly,
}

#[derive(Debug)]
struct SourceInfo {
    name: String,
    r#type: String,
    description: String,
}

#[derive(Debug)]
struct RecordItem {
    summary: String,
    data: Value,
}

#[derive(Debug)]
struct GroupedRecordsResponse {
    source: SourceInfo,
    records: Vec<RecordItem>,
}

fn get_time_range(r#type: RecordType) -> (DateTime<Utc>, DateTime<Utc>) {
    let now = Local::now();
    let date = now.date_naive();

    match r#type {
        RecordType::Daily => {
            let start = date
                .and_hms_opt(0, 0, 0)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);
            let end = date
                .and_hms_opt(23, 59, 59)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);
            (start, end)
        }
        RecordType::Weekly => {
            let days_from_monday = now.weekday().num_days_from_monday();
            let start_of_week = date - chrono::Duration::days(days_from_monday as i64);
            let start = start_of_week
                .and_hms_opt(0, 0, 0)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);
            let end_of_week = start_of_week + chrono::Duration::days(6);
            let end = end_of_week
                .and_hms_opt(23, 59, 59)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);
            (start, end)
        }
        RecordType::Monthly => {
            let start_date = date.with_day(1).unwrap();
            let start = start_date
                .and_hms_opt(0, 0, 0)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);

            let next_month = if date.month() == 12 {
                chrono::NaiveDate::from_ymd_opt(date.year() + 1, 1, 1).unwrap()
            } else {
                chrono::NaiveDate::from_ymd_opt(date.year(), date.month() + 1, 1).unwrap()
            };
            let end_date = next_month.pred_opt().unwrap();
            let end = end_date
                .and_hms_opt(23, 59, 59)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);
            (start, end)
        }
        RecordType::Yearly => {
            let start_date = chrono::NaiveDate::from_ymd_opt(date.year(), 1, 1).unwrap();
            let start = start_date
                .and_hms_opt(0, 0, 0)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);

            let end_date = chrono::NaiveDate::from_ymd_opt(date.year(), 12, 31).unwrap();
            let end = end_date
                .and_hms_opt(23, 59, 59)
                .unwrap()
                .and_local_timezone(Local)
                .unwrap()
                .with_timezone(&Utc);
            (start, end)
        }
    }
}

async fn get_records(
    db: &DatabaseConnection,
    r#type: RecordType,
    workspace_id: Option<i32>,
) -> Result<Vec<GroupedRecordsResponse>, sea_orm::DbErr> {
    let (start_time, end_time) = get_time_range(r#type);
    let start_ts = start_time.timestamp();
    let end_ts = end_time.timestamp();

    let mut query = prelude::Record::find()
        .filter(record::Column::CreatedAt.gte(start_ts))
        .filter(record::Column::CreatedAt.lte(end_ts));

    if let Some(ws_id) = workspace_id {
        query = query.filter(record::Column::WorkspaceId.eq(ws_id));
    }

    let enabled_sources = source::Entity::find()
        .filter(source::Column::Enabled.eq("true"))
        .all(db)
        .await?;

    if enabled_sources.is_empty() {
        return Ok(Vec::new());
    }

    let enabled_source_ids: Vec<i32> = enabled_sources.iter().map(|s| s.id).collect();
    query = query.filter(record::Column::SourceId.is_in(enabled_source_ids));

    let records = query
        .order_by_desc(record::Column::CreatedAt)
        .find_with_related(source::Entity)
        .all(db)
        .await?;

    let mut grouped: HashMap<i32, (SourceInfo, Vec<RecordItem>)> = HashMap::new();

    for (rec, sources) in records {
        if let Some(source) = sources.first() {
            let parsed_data: Value =
                serde_json::from_str(&rec.data).unwrap_or_else(|_| Value::Null);
            let record_item = RecordItem {
                summary: rec.summary,
                data: parsed_data,
            };
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

    let result: Vec<GroupedRecordsResponse> = grouped
        .into_iter()
        .map(|(_, (source, records))| GroupedRecordsResponse { source, records })
        .collect();

    Ok(result)
}

fn extract_relevant_data(source_type: &str, data: &serde_json::Map<String, Value>) -> String {
    match source_type.to_lowercase().as_str() {
        "git" => {
            let mut parts = Vec::new();
            if let Some(Value::Number(total_insertions)) = data.get("total_insertions") {
                if let Some(Value::Number(total_deletions)) = data.get("total_deletions") {
                    parts.push(format!("变更: +{} -{}", total_insertions, total_deletions));
                }
            }
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
            if let Some(Value::Object(status_obj)) = data.get("status") {
                if let Some(Value::String(status)) = status_obj.get("status") {
                    parts.push(format!("状态: {}", status));
                }
            }
            if let Some(Value::Object(list_obj)) = data.get("list") {
                if let Some(Value::String(list_name)) = list_obj.get("name") {
                    parts.push(format!("列表: {}", list_name));
                }
            }
            parts.join(", ")
        }
        _ => String::new(),
    }
}

pub async fn get_summary_prompt(
    db: Arc<DatabaseConnection>,
    r#type: RecordType,
    workspace_id: Option<i32>,
) -> Result<String, sea_orm::DbErr> {
    let grouped_records = get_records(db.as_ref(), r#type, workspace_id).await?;

    if grouped_records.is_empty() {
        return Ok(String::from("No record data available."));
    }

    let mut prompt = String::new();

    for (index, group) in grouped_records.iter().enumerate() {
        if index > 0 {
            prompt.push_str("\n");
        }
        prompt.push_str(&format!(
            "{} ({})\n",
            group.source.name, group.source.r#type
        ));
        if !group.source.description.is_empty() {
            prompt.push_str(&format!("{}\n", group.source.description));
        }
        if group.records.is_empty() {
            continue;
        }
        for record in group.records.iter() {
            prompt.push_str(&format!("- {}\n", record.summary));
            if let Value::Object(ref obj) = record.data {
                let extracted = extract_relevant_data(&group.source.r#type, obj);
                if !extracted.is_empty() {
                    prompt.push_str(&format!("  {}\n", extracted));
                }
            }
        }
    }

    Ok(prompt)
}
