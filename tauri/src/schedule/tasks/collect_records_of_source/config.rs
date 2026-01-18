use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct GitConfig {
    pub repository: String,
    pub branch: String,
    pub author: String,
}

#[derive(Debug, Deserialize)]
pub struct ClickupConfig {
    pub token: String,
    pub team: String,
    pub user: String,
}
