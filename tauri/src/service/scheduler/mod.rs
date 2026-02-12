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

async fn scheduler_loop(app_handle: tauri::AppHandle) {
    let mut interval = time::interval(Duration::from_secs(30));
    let mut last_trigger_time = String::new();

    loop {
        interval.tick().await;

        let setting = config::get_store_dat_setting(&app_handle);
        let now = Local::now();
        let current_time = now.format("%H:%M").to_string();

        if current_time == setting.daily_report_time && current_time != last_trigger_time {
            log::info!("Triggering scheduled daily report at {}", current_time);
            last_trigger_time = current_time.clone();
            if app_handle
                .emit("trigger_generate_daily_report", ())
                .is_err()
            {
                log::warn!("Emit trigger_generate_daily_report failed (frontend may be closed)");
            }
        }
    }
}
