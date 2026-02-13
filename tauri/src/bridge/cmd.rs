use std::sync::atomic::{AtomicBool, Ordering};

use crate::core::db::connection;

// 全局标志，确保数据库连接成功只运行一次
static DATABASE_LOADED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub async fn database_loaded(app_handle: tauri::AppHandle) -> Result<(), String> {
    if DATABASE_LOADED
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Ok(());
    }
    let _db = connection::connect(&app_handle).await;
    log::info!("Database Connection Successful");
    // Scheduler moved to frontend TypeScript cron service
    Ok(())
}
