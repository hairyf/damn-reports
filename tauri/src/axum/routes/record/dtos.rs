use serde::Deserialize;

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

