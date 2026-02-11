use std::sync::atomic::{AtomicBool, Ordering};

use crate::bridge::server;
use crate::core::db::connection;
use crate::service::collector;
use crate::service::scheduler;
use crate::service::llm;
use crate::task;
use sea_orm::DatabaseConnection;
use tauri::{AppHandle, State};

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
    let db = connection::connect(&app_handle).await;
    log::info!("Database Connection Successful");
    tauri::async_runtime::spawn(server::start(db.clone(), app_handle.clone()));
    scheduler::start(&app_handle, db.clone());
    Ok(())
}

#[tauri::command]
pub async fn collect_daily_records(db: State<'_, DatabaseConnection>) -> Result<usize, String> {
    let db_inner_clone = db.inner().clone();
    let count = task::collect_records_of_source::trigger(db_inner_clone)
        .await
        .map_err(|e| e.to_string())?;
    Ok(count)
}

#[tauri::command]
pub async fn generate_daily_report(app_handle: AppHandle, db: State<'_, DatabaseConnection>) -> Result<(), String> {
    // llm::generate_daily_report logic will be implemented later
    // For now we just call the (to be created) service function
    // We need to pass db connection
    let db_inner = db.inner().clone();
    llm::generate_daily_report(&app_handle, db_inner).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn collect_daily_clickup(
    token: String,
    team: String,
    user: String,
) -> Result<collector::clickup::CollectClickupResult, String> {
    collector::clickup::daily(token, team, user)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn collect_daily_git(
    repository: String,
    author: String,
) -> Result<collector::git::CollectGitResult, String> {
    collector::git::daily(repository, author)
        .await
        .map_err(|e| e.to_string())
}
