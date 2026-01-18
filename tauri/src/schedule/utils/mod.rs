use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

// 修改为接收 AppHandle，这样在 start 和 command 中都能复用
pub fn get_time_from_setting(app_handle: &AppHandle) -> (String, String) {
  // 注意：这里假设你已经正确配置了 store 插件
  // 在 Tauri v2 中 store api 有所变化，这里按通用逻辑处理
  let store = app_handle
      .store(".store.dat")
      .expect("Failed to load store");
  let setting = store.get("setting");

  (
    setting
      .as_ref()
      .and_then(|s| s.get("collectTime"))
      .and_then(|v| v.as_str())
      .map(|s| s.to_string())
      .unwrap_or_else(|| "05:45".to_string()),
    setting
      .as_ref()
      .and_then(|s| s.get("generateTime"))
      .and_then(|v| v.as_str())
      .map(|s| s.to_string())
      .unwrap_or_else(|| "05:50".to_string())
  )
}
