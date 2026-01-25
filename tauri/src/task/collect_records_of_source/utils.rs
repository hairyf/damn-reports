use crate::core::db::entities::{record, source};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::Serialize;
use super::traits;

// 3. 提取通用的映射函数
pub fn map_to_active_models<T: traits::Collectible + Serialize>(
  items: Vec<T>,
  source: &source::Model,
) -> Vec<record::ActiveModel> {
  items.into_iter().map(|item| {
      let date = item.get_date();
      record::ActiveModel {
          id: Set(item.get_id()),
          summary: Set(item.get_summary()),
          data: Set(item.to_json()),
          source_id: Set(source.id),
          workspace_id: Set(source.workspace_id),
          created_at: Set(date),
          updated_at: Set(date),
      }
  }).collect()
}

// 4. 封装查重逻辑
pub async fn insert_if_not_exists(db: &DatabaseConnection, records: Vec<record::ActiveModel>) -> Result<(), sea_orm::DbErr> {
  let total_count = records.len();
  log::debug!("Preparing to insert {} records", total_count);
  
  let ids: Vec<String> = records.iter().map(|r| r.id.as_ref().clone()).collect();
  
  let existing_ids: std::collections::HashSet<String> = record::Entity::find()
      .filter(record::Column::Id.is_in(ids))
      .all(db)
      .await?
      .into_iter()
      .map(|r| r.id)
      .collect();

  let new_records: Vec<_> = records.into_iter()
      .filter(|r| !existing_ids.contains(r.id.as_ref()))
      .collect();

  let existing_count = total_count - new_records.len();
  if existing_count > 0 {
    log::debug!("Skipping {} existing records", existing_count);
  }

  if !new_records.is_empty() {
      log::info!("Inserting {} new records", new_records.len());
      record::Entity::insert_many(new_records).exec(db).await?;
  } else {
      log::debug!("No new records to insert");
  }
  Ok(())
}
