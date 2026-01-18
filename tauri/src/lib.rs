mod axum;
mod collector;
mod database;
mod n8n;
mod schedule;
use std::sync::atomic::{AtomicBool, Ordering};
use crate::database::connection;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{Migration, MigrationKind};

// 全局标志，确保 database_loaded 只运行一次
static AXUM_STARTED_CALLED: AtomicBool = AtomicBool::new(false);

pub fn database_connect(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  if AXUM_STARTED_CALLED.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
      return Ok(());
  }
  match connection::connect(app_handle) {
      Ok(db) => {
          println!("✓ Database Connection Successful");
          tauri::async_runtime::spawn(axum::start(db.clone()));
          schedule::start_schedule(app_handle, db.clone());
          Ok(())
      }
      Err(e) => {
          AXUM_STARTED_CALLED.store(false, Ordering::SeqCst);
          eprintln!("✗ Database Connection Failed: {}", e);
          Ok(())
      }
  }
}

#[tauri::command]
fn database_loaded(app: tauri::AppHandle) -> Result<bool, String> {
    database_connect(&app).map_err(|e| e.to_string())?;
    Ok(true)
}

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initialize database",
            sql: include_str!("../prisma/migrations/20260118100407/migration.sql"),
            kind: MigrationKind::Up,
        },
    ];
    
    tauri::Builder::default()
        // Sql store plugin
        .plugin(tauri_plugin_sql::Builder::default().build())
        // Simple Store plugin
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:main.db", migrations)
                .build(),
        )
        .setup(|app| {
            n8n::start_n8n();
            database_connect(&app.handle())?;
            Ok(())
        })
        // HTTP plugin
        .plugin(tauri_plugin_http::init())
        // Notification plugin
        .plugin(tauri_plugin_notification::init())
        // Opener plugin
        .plugin(tauri_plugin_opener::init())
        // Dialog plugin
        .plugin(tauri_plugin_dialog::init())
        // FS plugin
        .plugin(tauri_plugin_fs::init())
        // Custom protocol plugin
        .invoke_handler(tauri::generate_handler![
            database_loaded,
            n8n::get_n8n_status,
            schedule::restart_schedule,
            collector::clickup::collect_daily_clickup,
            collector::git::collect_daily_git
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
