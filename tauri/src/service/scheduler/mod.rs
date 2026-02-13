use std::time::Duration;

use chrono::Local;
use tauri::Emitter;
use tokio::time;

use crate::config;

pub fn start(app_handle: &tauri::AppHandle) {
    log::info!("Starting scheduler service");
    let app_handle = app_handle.clone();
    tokio::spawn(async move {
        scheduler_loop(app_handle).await;
    });
}

/// 主会话每日清空触发时间（固定 00:00）
const MAIN_MEMORY_CLEAR_TIME: &str = "00:00";

async fn scheduler_loop(app_handle: tauri::AppHandle) {
    let mut interval = time::interval(Duration::from_secs(30));
    let mut last_report_trigger_time = String::new();
    let mut last_main_memory_trigger_date = String::new();

    loop {
        interval.tick().await;

        let setting = config::get_store_dat_setting(&app_handle);
        let now = Local::now();
        let current_time = now.format("%H:%M").to_string();
        let current_date = now.format("%Y-%m-%d").to_string();

        if current_time == setting.daily_report_time && current_time != last_report_trigger_time {
            log::info!("Triggering scheduled daily report at {}", current_time);
            last_report_trigger_time = current_time.clone();
            if app_handle
                .emit("trigger_generate_daily_report", ())
                .is_err()
            {
                log::warn!("Emit trigger_generate_daily_report failed (frontend may be closed)");
            }
        }

        if current_time == MAIN_MEMORY_CLEAR_TIME && current_date != last_main_memory_trigger_date {
            log::info!("Triggering main memory storage clear at {}", current_time);
            last_main_memory_trigger_date = current_date.clone();
            if app_handle
                .emit("trigger_main_memory_storage", ())
                .is_err()
            {
                log::warn!("Emit trigger_main_memory_storage failed (frontend may be closed)");
            }
        }
    }
}
