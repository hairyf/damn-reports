mod config;
mod traits;
mod utils;

use crate::database::entities::source;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use crate::collector;

use utils::map_to_active_models;
use utils::insert_if_not_exists;

pub async fn trigger(db: DatabaseConnection) -> Result<usize, Box<dyn std::error::Error>> {
  let sources = source::Entity::find()
      .filter(source::Column::Enabled.eq(true))
      .all(&db)
      .await?;

  let now = chrono::Utc::now().to_rfc3339();
  let mut all_records = Vec::new();

  for source in sources {
      let records = match source.r#type.to_lowercase().as_str() {
          "git" => {
              let cfg: config::GitConfig = serde_json::from_str(&source.config)?;
              let res = collector::git::daily(cfg.repository, cfg.branch, cfg.author).await?;
              map_to_active_models(res.data, &source, &now)
          }
          "clickup" => {
              let cfg: config::ClickupConfig = serde_json::from_str(&source.config)?;
              let res = collector::clickup::daily(cfg.token, cfg.team, cfg.user).await?;
              map_to_active_models(res.data, &source, &now)
          }
          _ => continue,
      };
      all_records.extend(records);
  }

  let count = all_records.len();
  
  if !all_records.is_empty() {
      // 2. 优化：直接尝试批量插入并忽略冲突 (需要底层数据库支持，如 SQLite/Postgres)
      // 如果数据库不支持，这里可以使用前面提到的 HashSet 过滤逻辑，但封装成辅助函数
      insert_if_not_exists(&db, all_records).await?;
  }

  Ok(count)
}