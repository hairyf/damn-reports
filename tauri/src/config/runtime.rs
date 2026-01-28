use std::path::{PathBuf};
use tauri::Manager;
use std::env;

use super::constants::*;
use super::utils::search_node_binary;

/// 获取 App Data 基础目录，处理潜在的错误
fn get_base_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_data_dir()
        .expect("Failed to resolve app data directory")
}

/// 获取应用安装目录（可执行文件所在目录）
// fn get_app_dir(_app_handle: &tauri::AppHandle) -> PathBuf {
//     // 使用标准库获取可执行文件所在目录
//     std::env::current_exe()
//         .expect("Failed to get current executable path")
//         .parent()
//         .expect("Failed to get parent directory")
//         .to_path_buf()
// }

pub fn db_url(app_handle: &tauri::AppHandle) -> String {
    let db_path = app_handle
        .path()
        .app_config_dir()
        .expect("No App config path was found!")
        .join(DB_NAME);

    // 数据库 URL 通常需要标准化路径分隔符为 '/'
    let normalized_path = db_path.to_string_lossy().replace('\\', "/");
    format!("{}{}", DB_URL_PREFIX, normalized_path)
}

pub fn get_node_download_url() -> Result<String, String> {
    let arch = env::consts::ARCH;
    let os = env::consts::OS;
    
    // 抽象文件名逻辑
    let filename = match (os, arch) {
        ("macos", "aarch64") => format!("node-{}-darwin-arm64.tar.gz", NODE_VERSION),
        ("macos", "x86_64")  => format!("node-{}-darwin-x64.tar.gz", NODE_VERSION),
        ("windows", _)       => format!("node-{}-win-x64.zip", NODE_VERSION),
        _ => return Err(format!("Unsupported platform: {} {}", os, arch)),
    };

    Ok(format!("{}/{}/{}", NODE_BASE_URL, NODE_VERSION, filename))
}

pub fn get_n8n_download_url() -> Result<String, String> {
    let arch = env::consts::ARCH;
    let os = env::consts::OS;
    
    // 根据平台和架构生成文件名
    let filename = match (os, arch) {
        ("windows", _) => "n8n-pkg-windows.zip".to_string(),
        ("macos", "aarch64") => "n8n-pkg-macos-arm64.zip".to_string(),
        ("macos", "x86_64") => "n8n-pkg-macos-x64.zip".to_string(),
        ("linux", _) => "n8n-pkg-linux.zip".to_string(),
        _ => return Err(format!("Unsupported platform: {} {}", os, arch)),
    };
    
    Ok(format!("{}{}{}", GITHUB_PROXY_PREFIX, N8N_CORE_URL, filename))
}

pub fn get_node_binary_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let runtime_dir = get_node_install_path(app_handle);
    // 使用 cfg 宏在编译时确定文件名，更高效
    let (rel_path, bin_name) = if cfg!(windows) {
        ("", "node.exe")
    } else {
        ("bin", "node")
    };
    let direct_path = runtime_dir.join(rel_path).join(bin_name);
    if direct_path.exists() {
        direct_path
    } else {
        // 只有在直接路径不存在时才进行开销较大的递归搜索
        search_node_binary(&runtime_dir, bin_name)
            .unwrap_or(direct_path)
    }
}

pub fn get_node_install_path(app_handle: &tauri::AppHandle) -> PathBuf {
  get_base_dir(app_handle).join("runtime")
}

pub fn get_n8n_install_path(app_handle: &tauri::AppHandle) -> PathBuf {
  get_base_dir(app_handle).join("dependencies").join("n8n")
}

pub fn get_n8n_binary_path(app_handle: &tauri::AppHandle) -> PathBuf {
    // 组合路径建议使用 join 以确保跨平台兼容性
    get_n8n_install_path(app_handle)
        .join("node_modules")
        .join("n8n")
        .join("bin")
        .join("n8n")
}

pub fn get_n8n_package_json_path(app_handle: &tauri::AppHandle) -> PathBuf {
    get_n8n_install_path(app_handle)
        .join("node_modules")
        .join("n8n")
        .join("package.json")
}

pub fn get_n8n_data_path(app_handle: &tauri::AppHandle) -> PathBuf {
    get_base_dir(app_handle).join("data").join("n8n")
}