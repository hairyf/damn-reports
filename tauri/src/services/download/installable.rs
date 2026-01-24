use tauri::{AppHandle};
use std::path::PathBuf;
use crate::config;
use async_trait::async_trait;

#[async_trait]
pub trait Installable {
    fn name(&self) -> &str;
    fn check_installed(&self, app: &AppHandle) -> bool;
    fn get_download_url(&self) -> Result<String, String>;
    fn get_install_path(&self, app: &AppHandle) -> PathBuf;
    fn get_temp_dir(&self, app: &AppHandle) -> PathBuf {
        self.get_install_path(app).parent().unwrap().join(format!("{}_temp", self.name().to_lowercase()))
    }
}

// --- Node.js 实现 ---
pub struct Nodejs;
#[async_trait]
impl Installable for Nodejs {
    fn name(&self) -> &str { "Node.js" }
    fn get_download_url(&self) -> Result<String, String> { config::get_node_download_url() }
    fn get_install_path(&self, app: &AppHandle) -> PathBuf { config::get_node_install_path(app) }
    fn check_installed(&self, app: &AppHandle) -> bool { config::get_node_binary_path(app).exists() }
}

// --- n8n 实现 ---
pub struct N8n;
#[async_trait]
impl Installable for N8n {
    fn name(&self) -> &str { "n8n" }
    fn get_download_url(&self) -> Result<String, String> { config::get_n8n_download_url() }
    fn get_install_path(&self, app: &AppHandle) -> PathBuf { config::get_n8n_install_path(app) }
    fn check_installed(&self, app: &AppHandle) -> bool { config::get_n8n_binary_path(app).exists() }
}