use serde::Deserialize;

#[derive(Debug, Deserialize)] 
pub struct GetRecordsParams {
  pub r#type: RecordType,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RecordType {
  Daily,
  Weekly,
  Monthly,
  Yearly,
}