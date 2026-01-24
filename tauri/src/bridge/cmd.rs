
use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, State};
use sea_orm::DatabaseConnection;
use crate::services::scheduler::SchedulerHandle;
use crate::core::db::connection;
use crate::bridge::server;
use crate::services::scheduler;
use crate::services::workflow;
use crate::services::collector;
use crate::services::scheduler::task;
use crate::config;

// 全局标志，确保数据库连接成功只运行一次
static DATABASE_LOADED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
pub async fn database_loaded(app_handle: tauri::AppHandle) -> Result<(), String> {
  if DATABASE_LOADED.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
    return Ok(());
  }
  let db = connection::connect(&app_handle).await;
  log::info!("Database Connection Successful");
  tauri::async_runtime::spawn(server::start(db.clone(), app_handle.clone()));
  scheduler::start(&app_handle, db.clone());
  Ok(())
}

#[tauri::command]
pub async fn restart_schedule(
  app_handle: AppHandle,
  db: State<'_, DatabaseConnection>,
  handle: State<'_, SchedulerHandle>,
) -> Result<(), String> {
  scheduler::restart(app_handle, db, handle).await.map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
pub async fn install_dependencies(app_handle: AppHandle) -> Result<(), String> {
  let mut setting = config::get_store_dat_setting(&app_handle);
  if setting.installed {
    log::debug!("Already installed, skipping installation");
    return Ok(());
  }
  log::debug!("Not installed detected, starting installation process");
  workflow::status::set_status(workflow::status::Status::Installing);
  workflow::status::emit_status(&app_handle);
  workflow::install(&app_handle).await?;
  log::debug!("Installation completed, marked as installed");
  setting.installed = true;
  config::set_store_dat_setting(&app_handle, setting);
  workflow::launch(app_handle).await?;
  Ok(())
}

#[tauri::command]
pub fn get_n8n_status() -> workflow::status::Status {
  workflow::status::get_status()
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
  author: String,
) -> Result<collector::git::CollectGitResult, String> {
  collector::git::daily(repository, author).await.map_err(|e| e.to_string())
}
