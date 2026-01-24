use tauri::{Manager};
use tauri_plugin_store::StoreExt;
use crate::config::{
    STORE_DAT_FILE, DEFAULT_COLLECT_TIME, DEFAULT_GENERATE_TIME, DB_NAME, DB_URL_PREFIX,
    STORE_SETTING_KEY, STORE_SETTING_COLLECT_TIME_KEY, STORE_SETTING_GENERATE_TIME_KEY,
};

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

pub fn store_dat_setting_collect_time(app_handle: &tauri::AppHandle) -> String {
    let store = app_handle
        .store(STORE_DAT_FILE)
        .expect("Failed to load store");
    let raw = store.get(STORE_SETTING_KEY);
    let setting = raw.as_ref().and_then(|v| {
        v.as_str()
            .and_then(|s| serde_json::from_str(s).ok())
            .or_else(|| Some(v.clone()))
    });
    setting
        .as_ref()
        .and_then(|s| s.get(STORE_SETTING_COLLECT_TIME_KEY))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| DEFAULT_COLLECT_TIME.to_string())
}

pub fn store_dat_setting_generate_time(app_handle: &tauri::AppHandle) -> String {
    let store = app_handle
        .store(STORE_DAT_FILE)
        .expect("Failed to load store");
    let raw = store.get(STORE_SETTING_KEY);
    let setting = raw.as_ref().and_then(|v| {
        v.as_str()
            .and_then(|s| serde_json::from_str(s).ok())
            .or_else(|| Some(v.clone()))
    });
    setting
        .as_ref()
        .and_then(|s| s.get(STORE_SETTING_GENERATE_TIME_KEY))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| DEFAULT_GENERATE_TIME.to_string())
}
