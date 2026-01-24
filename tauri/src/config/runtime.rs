use tauri::{Manager};
use std::path::PathBuf;

use std::env;

use super::utils::search_node_binary;
use super::constants::*;

pub fn db_url(app_handle: &tauri::AppHandle) -> String {
    let db_path = app_handle
        .path()
        .app_config_dir()
        .expect("No App path was found!")
        .join(DB_NAME)
        .to_string_lossy()
        .replace("\\", "/");

    format!("{}{}", DB_URL_PREFIX, db_path)
}

pub fn get_node_download_url() -> Result<String, String> {
    // n8n requires Node.js >=20.19 <= 24.x
    // Using Node.js 20.19.0 which is the minimum supported version
    let version = NODE_VERSION;
    let base_url = NODE_BASE_URL;
    match (env::consts::OS, env::consts::ARCH) {
        ("macos", "aarch64") => Ok(format!(
            "{}/{}/node-{}-darwin-arm64.tar.gz",
            base_url, version, version
        )),
        ("macos", "x86_64") => Ok(format!(
            "{}/{}/node-{}-darwin-x64.tar.gz",
            base_url, version, version
        )),
        ("windows", _) => Ok(format!(
            "{}/{}/node-{}-win-x64.zip",
            base_url, version, version
        )),
        _ => Err(format!(
            "Unsupported platform: {} {}",
            env::consts::OS,
            env::consts::ARCH
        )),
    }
}

pub fn get_n8n_download_url() -> Result<String, String> {
    let platform = match env::consts::OS {
        "windows" => "windows",
        "macos"   => "macos",
        "linux"   => "linux",
        _ => return Err(format!("Unsupported platform: {}", env::consts::OS)),
    };
    let file_name = format!("n8n-pkg-{}.zip", platform);
    let url = format!("{}{}/{}", GITHUB_PROXY_PREFIX, N8N_CORE_URL, file_name);
    Ok(url)
}

pub fn get_node_binary_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let runtime_dir = get_node_install_path(app_handle);
    if cfg!(target_os = "windows") {
        // 对于 Windows，先尝试直接路径，然后搜索
        let direct_path = runtime_dir.join("node.exe");
        if direct_path.exists() {
            return direct_path;
        }
        // 搜索嵌套目录中的 node.exe
        search_node_binary(&runtime_dir, "node.exe").unwrap_or(direct_path)
    } else {
        // MacOS/Linux: 先尝试直接路径 bin/node
        let direct_path = runtime_dir.join("bin/node");
        if direct_path.exists() {
            return direct_path;
        }
        // 搜索嵌套目录中的 bin/node
        search_node_binary(&runtime_dir, "bin/node").unwrap_or(direct_path)
    }
}

pub fn get_n8n_binary_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_path = app_handle.path().app_data_dir().unwrap();
    app_path.join("n8n-pkg/node_modules/n8n/bin/n8n")
}

pub fn get_node_install_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_data = app_handle.path().app_data_dir().unwrap();
    app_data.join("runtime")
}

pub fn get_n8n_install_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_data = app_handle.path().app_data_dir().unwrap();
    app_data.join("n8n-pkg")
}

pub fn get_n8n_data_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_data = app_handle.path().app_data_dir().unwrap();
    app_data.join("data/n8n")
}