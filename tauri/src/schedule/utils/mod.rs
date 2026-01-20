use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use chrono::{Local, NaiveTime};

/// 从设置中获取收集和生成时间
pub fn get_time_from_setting(app_handle: &AppHandle) -> (String, String) {
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

/// 检查今天是否已经执行过某个任务
pub fn has_executed_today(app_handle: &AppHandle, task_key: &str) -> bool {
    let store = match app_handle.store(".schedule.dat") {
        Ok(s) => s,
        Err(_) => return false,
    };
    
    let today = Local::now().date_naive().to_string();
    if let Some(value) = store.get(task_key) {
        if let Some(date_str) = value.as_str() {
            return date_str == today;
        }
    }
    false
}

/// 记录任务今天已执行
pub fn mark_executed_today(app_handle: &AppHandle, task_key: &str) {
    if let Ok(store) = app_handle.store(".schedule.dat") {
        let today = Local::now().date_naive().to_string();
        store.set(task_key, serde_json::Value::String(today));
        if let Err(e) = store.save() {
            eprintln!("Failed to save store for {}: {}", task_key, e);
        }
    }
}

/// 检查时间是否已过，如果已过且今天未执行，则执行任务
pub fn check_and_execute_if_needed<F>(
    app_handle: &AppHandle,
    time_str: &str,
    task_key: &str,
    task_name: &str,
    executor: F,
) where
    F: FnOnce() + Send + 'static,
{
    let now = Local::now().time();
    
    if let Ok(scheduled_time) = NaiveTime::parse_from_str(time_str, "%H:%M") {
        if now >= scheduled_time {
            if !has_executed_today(app_handle, task_key) {
                println!("{} time {} has passed and not executed today, executing immediately", task_name, time_str);
                mark_executed_today(app_handle, task_key);
                executor();
            } else {
                println!("{} time {} has passed but already executed today, skipping", task_name, time_str);
            }
        }
    }
}
