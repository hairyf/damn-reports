use tauri::{AppHandle};
use std::path::PathBuf;
use crate::config;
use async_trait::async_trait;

#[async_trait]
pub trait Installable: Send + Sync {
    fn title(&self) -> &str;
    fn check_installed(&self, app: &AppHandle) -> bool;
    fn get_download_url(&self) -> Result<String, String>;
    fn get_install_path(&self, app: &AppHandle) -> PathBuf;
}

// --- Node.js 实现 ---
pub struct Nodejs;
#[async_trait]
impl Installable for Nodejs {
    fn title(&self) -> &str { "Node.js Binary" }
    fn get_download_url(&self) -> Result<String, String> { config::get_node_download_url() }
    fn get_install_path(&self, app: &AppHandle) -> PathBuf { config::get_node_install_path(app) }
    fn check_installed(&self, app: &AppHandle) -> bool { config::get_node_binary_path(app).exists() }
}

// --- n8n 实现 ---
pub struct N8n;
#[async_trait]
impl Installable for N8n {
    fn title(&self) -> &str { "N8N Core" }
    fn get_download_url(&self) -> Result<String, String> { config::get_n8n_download_url() }
    fn get_install_path(&self, app: &AppHandle) -> PathBuf { config::get_n8n_install_path(app) }
    fn check_installed(&self, app: &AppHandle) -> bool { config::get_n8n_binary_path(app).exists() }
}