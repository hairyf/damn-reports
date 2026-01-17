mod axum;
mod collector;
mod database;
mod n8n;
mod schedule;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use database::connection;
use tauri_plugin_sql::{Migration, MigrationKind};
use std::sync::atomic::{AtomicBool, Ordering};

// 全局标志，确保 database_loaded 只运行一次
static DATABASE_LOADED_CALLED: AtomicBool = AtomicBool::new(false);

fn start_with_database(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    if DATABASE_LOADED_CALLED.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
        return Ok(());
    }
    let db = connection::connect(app_handle);
    match db {
        Ok(db) => {
            println!("✓ Database Connection Successful");
            axum::start(db);
            Ok(())
        }
        Err(e) => {
            DATABASE_LOADED_CALLED.store(false, Ordering::SeqCst);
            eprintln!("✗ Database Connection Failed: {}", e);
            Ok(())
        }
    }
}

#[tauri::command]
fn database_loaded(app: tauri::AppHandle) -> Result<bool, String> {
    start_with_database(&app).map_err(|e| e.to_string())?;
    Ok(true)
}

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initialize database",
            sql: include_str!("../prisma/migrations/20260117173215/migration.sql"),
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
            schedule::start::start(app);
            start_with_database(&app.handle())?;
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
            schedule::start::update_schedule_status,
            collector::clickup::collect_daily_clickup,
            collector::git::collect_daily_git
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
