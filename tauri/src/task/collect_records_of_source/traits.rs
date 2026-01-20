use serde::Serialize;

pub trait Collectible: Serialize {
  fn get_id(&self) -> String;
  fn get_summary(&self) -> String;
  fn get_date(&self) -> String;
  fn to_json(&self) -> String {
      serde_json::to_string(self).unwrap_or_else(|_| "{}".into())
  }
}

impl Collectible for crate::collector::git::GitCommit {
  fn get_id(&self) -> String { self.id.clone() }
  fn get_summary(&self) -> String { self.message.clone() }
  fn get_date(&self) -> String {
      // 将 Unix 时间戳转换为 RFC3339 格式
      chrono::DateTime::from_timestamp(self.date, 0)
          .map(|dt| dt.to_rfc3339())
          .unwrap_or_else(|| chrono::Utc::now().to_rfc3339())
  }
}

impl Collectible for crate::collector::clickup::ClickupTask {
  fn get_id(&self) -> String { self.id.clone() }
  fn get_summary(&self) -> String { self.name.clone() }
  fn get_date(&self) -> String {
      // 如果 date_updated 存在，直接使用；否则使用当前时间
      self.date_updated.clone()
          .unwrap_or_else(|| chrono::Utc::now().to_rfc3339())
  }
}