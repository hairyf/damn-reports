use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use serde_json::Value;

/// 从设置中获取收集和生成时间
pub fn get_time_from_setting(app_handle: &AppHandle) -> (String, String) {
  let store = app_handle
      .store(".store.dat")
      .expect("Failed to load store");
  
  let setting_raw = store.get("setting");
  
  // 解析 setting：可能是字符串或对象
  let setting: Option<Value> = setting_raw.as_ref().and_then(|v| {
    // 如果是字符串，先解析 JSON
    if let Some(str_val) = v.as_str() {
      serde_json::from_str::<Value>(str_val).ok()
    } else {
      // 如果已经是对象，直接使用
      Some(v.clone())
    }
  });

  let collect_time = setting
    .as_ref()
    .and_then(|s| s.get("collectTime"))
    .and_then(|v| v.as_str())
    .map(|s| s.to_string())
    .unwrap_or_else(|| "17:45".to_string());

  let generate_time = setting
    .as_ref()
    .and_then(|s| s.get("generateTime"))
    .and_then(|v| v.as_str())
    .map(|s| s.to_string())
    .unwrap_or_else(|| "17:50".to_string());

  (collect_time, generate_time)
}
