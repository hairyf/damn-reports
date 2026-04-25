mod config;
mod utils;
mod tray;
mod bridge;
mod database;
use tauri::{
    ipc::Invoke,
    Wry,
};

// setup app
fn setup(app_handle: tauri::AppHandle) {
  let _ = database::connection::connect(&app_handle);
}

// configure invoke handler
fn handler() -> impl Fn(Invoke<Wry>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
      bridge::webview_create,
      bridge::webview_eval,
    ]
}

// configure tauri builder
fn builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // Opener plugin
        .plugin(tauri_plugin_opener::init())
        // Simple Store plugin
        .plugin(tauri_plugin_store::Builder::new().build())
        // Sql store plugin
        .plugin(
          tauri_plugin_sql::Builder::default()
            .add_migrations(
              &format!("{}{}", config::DB_URL_PREFIX, config::DB_NAME),
              database::migrations::migrations(),
            )
            .build()
        )
        // HTTP plugin
        .plugin(tauri_plugin_http::init())
        // Notification plugin
        .plugin(tauri_plugin_notification::init())
        // Opener plugin
        .plugin(tauri_plugin_opener::init())
        // Dialog plugin
        .plugin(tauri_plugin_dialog::init())
        // Process plugin
        .plugin(tauri_plugin_process::init())
}

// run app
pub fn run() {

    builder()
        .setup(|app| {
            tray::setup(&app.handle()).unwrap();
            setup(app.handle().clone());
            Ok(())
        })
        // Custom protocol plugin
        .invoke_handler(handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
