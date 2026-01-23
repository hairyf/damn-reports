use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RecordType {
  Daily,
  Weekly,
  Monthly,
  Yearly,
}

#[derive(Debug, Deserialize)] 
pub struct GetRecordsParams {
  pub r#type: RecordType,
  #[serde(alias = "workspaceId")]
  pub workspace_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SourceInfo {
  pub name: String,
  #[serde(rename = "type")]
  pub r#type: String,
  pub description: String,
}

#[derive(Debug, Serialize)]
pub struct RecordItem {
  pub summary: String,
  pub data: Value,
}

#[derive(Debug, Serialize)]
pub struct GroupedRecordsResponse {
  pub source: SourceInfo,
  pub records: Vec<RecordItem>,
}
