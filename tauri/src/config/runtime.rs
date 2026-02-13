use tauri::Manager;

use super::constants::*;

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
