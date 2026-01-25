use std::time::Duration;
use tauri::AppHandle;
use tokio::time;

pub fn start(app_handle: &AppHandle, _db: sea_orm::DatabaseConnection) {
    log::info!("Starting n8n process monitor");
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        scheduler_permanent_loop(app_handle_clone).await;
    });
}

async fn scheduler_permanent_loop(app_handle: AppHandle) {
    let mut interval = time::interval(Duration::from_secs(1));
    
    loop {
        crate::task::tick_check_n8n_process::trigger(app_handle.clone()).await.unwrap();
        interval.tick().await;
    }
}
