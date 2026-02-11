use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crate::core::db::connection;
use crate::service::collector;
use crate::service::record;
use crate::service::scheduler;
use crate::task;
use sea_orm::DatabaseConnection;
use tauri::{AppHandle, Emitter, State};

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
    scheduler::start(&app_handle);
    Ok(())
}

#[tauri::command]
pub async fn get_record_summary(
    db: State<'_, DatabaseConnection>,
    workspace_id: Option<i32>,
) -> Result<String, String> {
    let db = Arc::new(db.inner().clone());
    record::get_summary_prompt(db, record::RecordType::Daily, workspace_id)
        .await
        .map_err(|e| e.to_string())
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
pub async fn generate_daily_report(app_handle: AppHandle) -> Result<(), String> {
    app_handle.emit("trigger_generate_daily_report", ()).map_err(|e| e.to_string())?;
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
