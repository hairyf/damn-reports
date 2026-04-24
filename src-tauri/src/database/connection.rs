use crate::config::db_url;
use sea_orm::{Database, DatabaseConnection};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Manager;

// 全局标志，确保数据库连接成功只运行一次
static DATABASE_LOADED: AtomicBool = AtomicBool::new(false);

/// 初始化数据库连接池并存储到应用状态
/// 返回连接池以便传递给其他服务（如 Axum 服务器）
pub async fn connect(app_handle: &tauri::AppHandle) -> Result<(), String> {
    if DATABASE_LOADED.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
      return Ok(());
    }
    // log::info!("Initializing Database Connection...");

    let db_url = db_url(app_handle);

    // log::debug!("Database URL: {}", db_url);
    // 创建连接池
    let db: DatabaseConnection = Database::connect(db_url).await.unwrap();

    // log::info!("Database connection established");

    // 将连接池存储到应用状态中（用于 Tauri 命令）
    app_handle.manage(db.clone());

    Ok(())
}
