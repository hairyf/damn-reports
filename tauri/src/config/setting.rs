use serde::Serialize;
use serde::Deserialize;
use tauri_plugin_store::StoreExt;
use super::constants::*;
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Setting {
    pub language: String,
    pub auto_save: bool,
    pub notifications: bool,
    pub auto_check_update: bool,
    pub collect_time: String,
    pub generate_time: String,
}

impl Setting {
    fn default() -> Self {
        Self {
            language: "zh-CN".to_string(),
            auto_save: true,
            notifications: true,
            auto_check_update: true,
            collect_time: "17:45".to_string(),
            generate_time: "17:50".to_string(),
        }
    }
}

pub fn set_store_dat_setting(app_handle: &tauri::AppHandle, setting: Setting) {
    let store = app_handle
        .store(STORE_DAT_FILE)
        .expect("Failed to load store");
    store.set(STORE_SETTING_KEY, serde_json::to_value(&setting).unwrap());
    store.save().expect("Failed to save store");
}

pub fn get_store_dat_setting(app_handle: &tauri::AppHandle) -> Setting {
    let store = app_handle
        .store(STORE_DAT_FILE)
        .expect("Failed to load store");
    let raw = store.get(STORE_SETTING_KEY);
    let value = raw.as_ref().and_then(|v| {
        v.as_str()
            .and_then(|s| serde_json::from_str(s).ok())
            .or_else(|| Some(v.clone()))
    });
    value
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_else(Setting::default)
}
