use serde::Serialize;

pub trait Collectible: Serialize {
  fn get_id(&self) -> String;
  fn get_summary(&self) -> String;
  fn get_date(&self) -> i64;
  fn to_json(&self) -> String {
      serde_json::to_string(self).unwrap_or_else(|_| "{}".into())
  }
}

impl Collectible for crate::services::collector::git::GitCommit {
  fn get_id(&self) -> String { self.id.clone() }
  fn get_summary(&self) -> String { self.message.clone() }
  fn get_date(&self) -> i64 {
      // 直接返回 Unix 时间戳
      self.date
  }
}

impl Collectible for crate::services::collector::clickup::ClickupTask {
  fn get_id(&self) -> String {
      // 使用组合键：任务ID + 状态
      // 这样同一个任务的状态变更可以创建不同的记录
      let status = &self.status.status;
      format!("{}:{}", self.id, status)
  }
  fn get_summary(&self) -> String { self.name.clone() }
  fn get_date(&self) -> i64 {
      // 如果 date_updated 存在，解析为时间戳；否则使用当前时间戳
      if let Some(date_str) = &self.date_updated {
          // 尝试解析 RFC3339 格式的字符串
          if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(date_str) {
              dt.timestamp()
          } else {
              chrono::Utc::now().timestamp()
          }
      } else {
          chrono::Utc::now().timestamp()
      }
  }
}
