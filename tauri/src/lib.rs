mod axum;
mod collector;
mod database;
mod n8n;
mod schedule;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use database::connection;
use database::migration;

fn start_with_database(app: &tauri::App) {
    match connection::connect(app) {
        Ok(db) => {
            println!("✓ Database Connection Successful");
            axum::start(db);
        }
        Err(e) => {
            eprintln!("✗ Database Connection Failed: {}", e);
            eprintln!("  Axum Service will not start");
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        // Sql store plugin
        .plugin(tauri_plugin_sql::Builder::default().build())
        // Simple Store plugin
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            n8n::start_n8n();
            schedule::start::start(app);
            migration::migrate(app)?;
            start_with_database(app);
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
            n8n::get_n8n_status,
            schedule::start::update_schedule_status,
            collector::clickup::collect_daily_clickup,
            collector::git::collect_daily_git
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
