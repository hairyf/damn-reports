use super::constants::*;
use serde::Deserialize;
use serde::Serialize;
use tauri::Emitter;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Setting {
    pub language: String,
    pub auto_save: bool,
    pub notifications: bool,
    pub auto_check_update: bool,
    pub llm_api_key: String,
    pub llm_base_url: String,
    pub llm_model: String,
    pub is_llm_env_configured: bool,
}

impl Default for Setting {
    fn default() -> Self {
        Self {
            language: "zh-CN".to_string(),
            auto_save: true,
            notifications: true,
            auto_check_update: true,
            llm_api_key: "".to_string(),
            llm_base_url: "https://api.deepseek.com".to_string(),
            llm_model: "deepseek-chat".to_string(),
            is_llm_env_configured: false,
        }
    }
}

#[allow(dead_code)]
pub fn set_store_dat_setting(app_handle: &tauri::AppHandle, setting: Setting) {
    let store = app_handle
        .store(STORE_DAT_FILE)
        .expect("Failed to load store");
    store.set(STORE_SETTING_KEY, serde_json::to_value(&setting).unwrap());
    store.save().expect("Failed to save store");
    app_handle
        .emit("setting_updated", &serde_json::to_value(&setting).unwrap())
        .expect("Failed to emit event");
}

#[allow(dead_code)]
pub fn get_store_dat_setting(app_handle: &tauri::AppHandle) -> Setting {
    let store = app_handle
        .store(STORE_DAT_FILE)
        .expect("Failed to load store");

    // 强制从磁盘重新加载，确保数据是最新的
    // store.load().expect("Failed to reload store from disk");

    let raw = store.get(STORE_SETTING_KEY);

    if raw.is_none() {
        log::warn!("Setting key '{}' not found in store", STORE_SETTING_KEY);
    }

    raw
        .as_ref()
        .and_then(|v| {
            v.as_str()
                .and_then(|s| serde_json::from_str(s).ok())
                .or_else(|| Some(v.clone()))
        })
        .and_then(|v| serde_json::from_value::<Setting>(v).ok())
        .unwrap_or_else(|| {
            log::warn!("Failed to parse setting, using default");
            Setting::default()
        })
}
