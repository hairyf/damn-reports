use serde::Deserialize;
use crate::collector::git;
use crate::collector::clickup;

#[derive(Debug, Deserialize)] 
#[serde(rename_all = "lowercase")]
pub enum SourceType {
  Git,
  Clickup,
}

pub fn trigger() {
  
}

