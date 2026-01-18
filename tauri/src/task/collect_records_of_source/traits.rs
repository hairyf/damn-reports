use serde::Serialize;

pub trait Collectible: Serialize {
  fn get_id(&self) -> String;
  fn get_summary(&self) -> String;
  fn to_json(&self) -> String {
      serde_json::to_string(self).unwrap_or_else(|_| "{}".into())
  }
}

impl Collectible for crate::collector::git::GitCommit {
  fn get_id(&self) -> String { self.id.clone() }
  fn get_summary(&self) -> String { self.message.clone() }
}

impl Collectible for crate::collector::clickup::ClickupTask {
  fn get_id(&self) -> String { self.id.clone() }
  fn get_summary(&self) -> String { self.name.clone() }
}