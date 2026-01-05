mod n8n;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

    pub fn run() {
    tauri::Builder::default()
        .manage(n8n::N8nState(std::sync::Mutex::new(n8n::N8nStatus::Initial)))
        .setup(|app| {
            let state = app.state::<n8n::N8nState>();
            n8n::start_n8n(&state);
            Ok(())
        })
        // HTTP plugin
        .plugin(tauri_plugin_http::init())
        // Sql store plugin
        .plugin(tauri_plugin_sql::Builder::new().build())
        // Simple Store plugin
        .plugin(tauri_plugin_store::Builder::new().build())
        // Notification plugin
        .plugin(tauri_plugin_notification::init())
        // Opener plugin
        .plugin(tauri_plugin_opener::init())
        // Dialog plugin
        .plugin(tauri_plugin_dialog::init())
        // FS plugin
        .plugin(tauri_plugin_fs::init())
        // Custom protocol plugin
        .invoke_handler(tauri::generate_handler![greet, n8n::get_n8n_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
