use std::time::Duration;
use tauri::AppHandle;
use tokio::time;
use chrono::Local;
use sea_orm::DatabaseConnection;
use crate::config;
use crate::service::llm;

pub fn start(app_handle: &AppHandle, db: DatabaseConnection) {
    log::info!("Starting scheduler service");
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        scheduler_loop(app_handle_clone, db).await;
    });
}

async fn scheduler_loop(app_handle: AppHandle, db: DatabaseConnection) {
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
             
             let app_handle = app_handle.clone();
             let db = db.clone();
             tokio::spawn(async move {
                 if let Err(e) = llm::generate_daily_report(&app_handle, db).await {
                     log::error!("Failed to generate daily report: {}", e);
                 }
             });
        }
    }
}
