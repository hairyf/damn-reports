use sea_orm::{Database, DatabaseConnection};
use tauri::Manager;
use crate::config::db_url;

/// 初始化数据库连接池并存储到应用状态
/// 返回连接池以便传递给其他服务（如 Axum 服务器）
pub async fn connect(app_handle: &tauri::AppHandle) -> DatabaseConnection {
    println!("Initializing Database Connection...");

    let db_url = db_url(app_handle);

    println!("{}", db_url);
    // 创建连接池
    let db: DatabaseConnection = Database::connect(db_url).await.unwrap();

    // 将连接池存储到应用状态中（用于 Tauri 命令）
    app_handle.manage(db.clone());

    db
}
