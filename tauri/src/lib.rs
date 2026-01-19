mod axum;
mod collector;
mod command;
mod database;
mod n8n;
mod schedule;
mod task;

use tauri::{ipc::Invoke, Wry};
use tauri_plugin_sql::{Migration, MigrationKind};

// setup app
fn setup(app_handle: tauri::AppHandle) {
    let _ = command::database_loaded(app_handle);
    let _ = n8n::start();
}

// configure handler
fn handler() -> impl Fn(Invoke<Wry>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        command::database_loaded,
        command::restart_schedule,
        command::get_n8n_status,
        command::collect_daily_records,
        command::generate_daily_report,
        command::collect_daily_clickup,
        command::collect_daily_git,
    ]
}

// configure builder
fn builder() -> tauri::Builder<tauri::Wry> {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initialize database",
            sql: include_str!("../prisma/migrations/20260118100407/migration.sql"),
            kind: MigrationKind::Up,
        }
    ];
    tauri::Builder::default()
    // Simple Store plugin
    .plugin(tauri_plugin_store::Builder::new().build())
    // Sql store plugin
    .plugin(
        tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:main.db", migrations)
            .build(),
    )
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
    // Process plugin
    .plugin(tauri_plugin_process::init())
}

// run app
pub fn run() {
    builder()
        .setup(|app| {
            setup(app.handle().clone());
            Ok(())
        })
        // Custom protocol plugin
        .invoke_handler(handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
