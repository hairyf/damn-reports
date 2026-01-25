mod config;
mod traits;
mod utils;

use crate::core::db::entities::source;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use crate::service::collector;

use utils::map_to_active_models;
use utils::insert_if_not_exists;

pub async fn trigger(db: DatabaseConnection) -> Result<usize, Box<dyn std::error::Error>> {
  log::info!("Starting record collection");
  let sources = source::Entity::find()
      .filter(source::Column::Enabled.eq("true"))
      .all(&db)
      .await?;

  log::info!("Found {} enabled sources", sources.len());
  let mut all_records = Vec::new();

  for source in sources {
      let records = match source.r#type.to_lowercase().as_str() {
          "git" => {
              let cfg: config::GitConfig = serde_json::from_str(&source.config)?;
              log::debug!("Collecting git records for source: {:?}", source.r#type);
              log::trace!("Config: {:?}", cfg);
              let res = collector::git::daily(cfg.repository, cfg.author).await?;
              log::info!("Collected {} git records", res.data.len());
              map_to_active_models(res.data, &source)
          }
          "clickup" => {
              let cfg: config::ClickupConfig = serde_json::from_str(&source.config)?;
              log::debug!("Collecting clickup records for source: {:?}", source.r#type);
              log::trace!("Config: {:?}", cfg);
              let res = collector::clickup::daily(cfg.token, cfg.team, cfg.user).await?;
              log::info!("Collected {} clickup records", res.data.len());
              map_to_active_models(res.data, &source)
          }
          _ => {
              log::warn!("Unknown source type: {}", source.r#type);
              continue;
          },
      };
      all_records.extend(records);
  }

  let count = all_records.len();
  
  log::info!("Collected {} records in total", count);

  if !all_records.is_empty() {
      log::debug!("Inserting records into database");
      // 2. 优化：直接尝试批量插入并忽略冲突 (需要底层数据库支持，如 SQLite/Postgres)
      // 如果数据库不支持，这里可以使用前面提到的 HashSet 过滤逻辑，但封装成辅助函数
      insert_if_not_exists(&db, all_records).await?;
      log::info!("Records inserted successfully");
  } else {
      log::debug!("No records to insert");
  }

  Ok(count)
}
