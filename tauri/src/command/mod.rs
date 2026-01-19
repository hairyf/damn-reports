
use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, State};
use sea_orm::DatabaseConnection;
use crate::schedule::SchedulerHandle;
use crate::database::connection;
use crate::axum;
use crate::schedule;
use crate::n8n;
use crate::collector;
use crate::task;

// 全局标志，确保数据库连接成功只运行一次
static DATABASE_LOADED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub async fn database_loaded(app_handle: tauri::AppHandle) -> Result<(), String> {
  if DATABASE_LOADED.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
    return Ok(());
  }
  let db = connection::connect(&app_handle).await;
  println!("✓ Database Connection Successful");
  tauri::async_runtime::spawn(axum::start(db.clone()));
  schedule::start_schedule(&app_handle, db.clone());
  Ok(())
}

#[tauri::command]
pub async fn restart_schedule(
  app_handle: AppHandle,
  db: State<'_, DatabaseConnection>,
  handle: State<'_, SchedulerHandle>,
) -> Result<(), String> {
  schedule::restart(app_handle, db, handle).await.map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
pub fn get_n8n_status() -> n8n::status::Status {
  n8n::status::get_status()
}

#[tauri::command]
pub async fn collect_daily_records(
  db: State<'_, DatabaseConnection>,
) -> Result<usize, String> {
  let db_inner_clone = db.inner().clone();
  let count = task::collect_records_of_source::trigger(db_inner_clone)
    .await
    .map_err(|e| e.to_string())?;
  Ok(count)
}

#[tauri::command]
pub async fn generate_daily_report() -> Result<(), String> {
  task::call_n8n_workflow_webhook::trigger().await.map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
pub async fn collect_daily_clickup(
  token: String,
  team: String,
  user: String,
) -> Result<collector::clickup::CollectClickupResult, String> {
  collector::clickup::daily(token, team, user).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn collect_daily_git(
  repository: String,
  branch: String,
  author: String,
) -> Result<collector::git::CollectGitResult, String> {
  collector::git::daily(repository, branch, author).await.map_err(|e| e.to_string())
}

