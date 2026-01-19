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
pub struct RecordWithSource {
  pub id: String,
  pub summary: String,
  pub data: Value, // 解析后的 JSON 对象
  #[serde(rename = "createdAt")]
  pub created_at: String,
  #[serde(rename = "updatedAt")]
  pub updated_at: String,
  #[serde(rename = "sourceId")]
  pub source_id: i32,
  #[serde(rename = "workspaceId")]
  pub workspace_id: i32,
  #[serde(rename = "sourceName")]
  pub source_name: String,
  pub source: String, // source type
}
