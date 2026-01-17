use tauri::Manager;
use sea_orm::{Database, DatabaseConnection};

/// 初始化数据库连接池并存储到应用状态
/// 返回连接池以便传递给其他服务（如 Axum 服务器）
pub fn connect(app_handle: &tauri::AppHandle) -> Result<DatabaseConnection, Box<dyn std::error::Error>> {

    println!("Initializing Database Connection...");

    // 在同步上下文中使用 block_on 来初始化数据库
    tauri::async_runtime::block_on(async move {
        let db_path = app_handle
            .path()
            .app_config_dir()
            .expect("No App path was found!")
            .join("main.db")
            .to_string_lossy().replace("\\", "/");

        let db_url = format!("sqlite:{}", db_path);
    
        println!("{}", db_url);
        // 创建连接池
        let db: DatabaseConnection = Database::connect(db_url).await?;

        // 将连接池存储到应用状态中（用于 Tauri 命令）
        app_handle.manage(std::sync::Mutex::new(db.clone()));
        
        Ok(db)
    })
}
