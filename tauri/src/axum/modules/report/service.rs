use sea_orm::{DatabaseConnection, EntityTrait, ActiveModelTrait, Set};
use uuid::Uuid;
use chrono::Utc;
use std::sync::Arc;

use crate::axum::modules::report::dtos::{ReportCreateInput, ReportType};
use crate::database::entities::{prelude, report};

pub async fn create_report(
  db: Arc<DatabaseConnection>,
  input: ReportCreateInput,
) -> Result<report::Model, sea_orm::DbErr> {
  // 生成 UUID
  let id = Uuid::new_v4().to_string();
  
  // 生成当前时间戳（ISO 8601 格式）
  let now = Utc::now().to_rfc3339();
  
  let report_type = input.r#type.unwrap_or_else(|| ReportType::Daily);

  // 为缺失的字段提供默认值
  let name = input.name.unwrap_or_else(|| {
    format!("报告 {}", Utc::now().format("%Y-%m-%d %H:%M:%S"))
  });

  // 创建 ActiveModel 并插入报告
  let new_report = report::ActiveModel {
    id: Set(id.clone()),
    name: Set(name.clone()),
    r#type: Set(report_type.to_string()),
    content: Set(input.content.clone()),
    created_at: Set(now.clone()),
    updated_at: Set(now.clone()),
    workflow_id: Set(input.workflow_id.clone()),
  };

  new_report.insert(&*db).await?;

  // 查询刚插入的报告
  let report_model = prelude::Report::find_by_id(id)
    .one(&*db)
    .await?
    .ok_or_else(|| sea_orm::DbErr::RecordNotFound("Report not found after insertion".to_string()))?;

  Ok(report_model)
}

