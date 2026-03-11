mod bridge;
mod config;
mod core;
mod logger;
mod service;
mod task;

use core::utils::{navigate, show_window};
use tauri::{
    ipc::Invoke,
    menu::{Menu, MenuEvent, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime, Wry,
};
use tauri_plugin_sql::{Migration, MigrationKind};

// setup app
fn setup(_app_handle: tauri::AppHandle) {}

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
        .tooltip("Damn Reports")
        .on_menu_event(move |app, event| handle_menu_event(app, &event))
        .on_tray_icon_event(move |tray, event| handle_tray_icon_event(&tray, &event))
        .build(app)?;

    Ok(())
}

// configure invoke handler
fn handler() -> impl Fn(Invoke<Wry>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        bridge::archive::workspace_export_tools,
        bridge::archive::workspace_import_tools,
        bridge::archive::workspace_export_cron,
        bridge::archive::workspace_import_cron,
        bridge::archive::workspace_install_dependencies,
        bridge::cmd::database_loaded,
        bridge::fs::fs_exists,
        bridge::fs::fs_read_file,
        bridge::fs::fs_write_file,
        bridge::fs::fs_read_text_file,
        bridge::fs::fs_write_text_file,
        bridge::fs::fs_read_dir,
        bridge::fs::fs_remove,
        bridge::fs::fs_grep,
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
        Migration {
            version: 3,
            description: "remove source table, change record.sourceId to string",
            sql: include_str!("../prisma/migrations/20260212000000/migration.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add tool column to record",
            sql: include_str!("../prisma/migrations/20260212100000/migration.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "rename record.sourceId to source",
            sql: include_str!("../prisma/migrations/20260212100001/migration.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "remove workspace table",
            sql: include_str!("../prisma/migrations/20260213000000/migration.sql"),
            kind: MigrationKind::Up,
        },
    ];
    for migration in &migrations {
        log::info!("Migration: {}", migration.description);
    }
    tauri_plugin_sql::Builder::default().add_migrations(
        &format!("{}{}", config::DB_URL_PREFIX, config::DB_NAME),
        migrations,
    )
}

// configure tauri builder
fn builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Opener plugin
        .plugin(tauri_plugin_opener::init())
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
