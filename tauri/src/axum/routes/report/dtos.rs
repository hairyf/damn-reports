use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub enum ReportType {
  Daily,
  Weekly,
  Monthly,
  Yearly,
}

impl ReportType {
  pub fn to_string(self) -> String {
    match self {
      ReportType::Daily => String::from("daily"),
      ReportType::Weekly => String::from("weekly"),
      ReportType::Monthly => String::from("monthly"),
      ReportType::Yearly => String::from("yearly"),
    }
  }
}

#[derive(Debug, Deserialize)]
pub struct ReportCreateInput {
  #[serde(default)]
  pub name: Option<String>,
  #[serde(default)]
  pub r#type: Option<ReportType>,
  #[serde(alias = "text")]
  pub content: String,
  #[serde(alias = "workspaceId")]
  pub workspace_id: i32,
}

