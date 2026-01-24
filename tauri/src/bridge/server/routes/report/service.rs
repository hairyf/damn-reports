use sea_orm::{DatabaseConnection, ActiveModelTrait, Set};
use chrono::Utc;
use std::sync::Arc;

use crate::bridge::server::routes::report::dtos::{ReportCreateInput, ReportType};
use crate::core::db::entities::report;

pub async fn create_report(
  db: Arc<DatabaseConnection>,
  input: ReportCreateInput,
) -> Result<report::Model, sea_orm::DbErr> {
  log::info!("Creating report: workspace_id={}", input.workspace_id);
  // 生成当前时间戳（ISO 8601 格式）
  let now = Utc::now().to_rfc3339();
  
  let report_type = input.r#type.unwrap_or_else(|| ReportType::Daily);
  log::debug!("Report type: {:?}", report_type);

  // 为缺失的字段提供默认值
  let name = input.name.unwrap_or_else(|| {
    format!("Report {}", Utc::now().format("%Y-%m-%d %H:%M:%S"))
  });
  log::debug!("Report name: {}", name);

  // 创建 ActiveModel 并插入报告
  // id 不需要设置，数据库自动生成
  let new_report = report::ActiveModel {
    name: Set(name.clone()),
    r#type: Set(report_type.to_string()),
    content: Set(input.content.clone()),
    created_at: Set(now.clone()),
    updated_at: Set(now.clone()),
    workspace_id: Set(input.workspace_id),
    ..Default::default()
  };

  let result = new_report.insert(&*db).await?;
  log::info!("Report created successfully: id={}, name={}", result.id, result.name);
  Ok(result)
}
