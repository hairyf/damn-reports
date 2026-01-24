mod bridge;
mod config;
mod core;
mod logger;
mod services;

use tauri::{
    ipc::Invoke,
    menu::{Menu, MenuEvent, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime, Wry,
};
use tauri_plugin_sql::{Migration, MigrationKind};
use core::utils::{navigate, show_window};
use crate::config::{DB_NAME, DB_URL_PREFIX};

// setup app
fn setup(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        if let Err(e) = services::workflow::start(app_handle).await {
            log::error!("start failed: {}", e);
        }
    });
}

// setup tray
fn tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    // 使用默认窗口图标
    let icon = app.default_window_icon().unwrap().clone();

    // 构建菜单
    let menu = Menu::with_items(
        app,
        &[
            &MenuItem::with_id(app, "overview", "打开面板", true, None::<&str>)?,
            &MenuItem::with_id(app, "reports", "报告列表", true, None::<&str>)?,
            &MenuItem::with_id(app, "settings", "设置", true, None::<&str>)?,
            &MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?,
        ],
    )?;

    fn handle_menu_event<R: Runtime>(app: &tauri::AppHandle<R>, event: &MenuEvent) {
        match event.id().as_ref() {
            "overview" => {
                if let Some(window) = app.get_webview_window("main") {
                    navigate(&window, "/");
                    show_window(&window);
                }
            }
            "reports" => {
                if let Some(window) = app.get_webview_window("main") {
                    navigate(&window, "/report");
                    show_window(&window);
                }
            }
            "settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    navigate(&window, "/setting");
                    show_window(&window);
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        }
    }

    fn handle_tray_icon_event<R: Runtime>(tray: &tauri::tray::TrayIcon<R>, event: &TrayIconEvent) {
        let app = tray.app_handle();
        match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                ..
            } => {
                if let Some(window) = app.get_webview_window("main") {
                    show_window(&window);
                }
            }
            _ => {}
        }
    }

    // 构建托盘图标
    let _ = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("Damn Daily Reports")
        .on_menu_event(move |app, event| handle_menu_event(app, &event))
        .on_tray_icon_event(move |tray, event| handle_tray_icon_event(&tray, &event))
        .build(app)?;

    Ok(())
}

// configure invoke handler
fn handler() -> impl Fn(Invoke<Wry>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        bridge::cmd::database_loaded,
        bridge::cmd::restart_schedule,
        bridge::cmd::install_dependencies,
        bridge::cmd::get_n8n_status,
        bridge::cmd::collect_daily_records,
        bridge::cmd::generate_daily_report,
        bridge::cmd::collect_daily_clickup,
        bridge::cmd::collect_daily_git,
    ]
}

// configure sql migrations
fn migrations() -> tauri_plugin_sql::Builder {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initialize database",
            sql: include_str!("../prisma/migrations/20260118100407/migration.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add branch field to git source configs",
            sql: include_str!("../prisma/migrations/20260122130600/migration.sql"),
            kind: MigrationKind::Up,
        },
    ];
    for migration in &migrations {
      log::info!("Migration: {}", migration.description);
    }
    tauri_plugin_sql::Builder::default().add_migrations(&format!("{}{}", DB_URL_PREFIX, DB_NAME), migrations)
}

// configure tauri builder
fn builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        // Simple Store plugin
        .plugin(tauri_plugin_store::Builder::new().build())
        // Sql store plugin
        .plugin(migrations().build())
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
    // 初始化日志系统
    logger::init();
    
    builder()
        .setup(|app| {
            tray(&app.handle()).unwrap();
            setup(app.handle().clone());
            Ok(())
        })
        // Custom protocol plugin
        .invoke_handler(handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
