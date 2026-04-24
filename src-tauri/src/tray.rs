use crate::utils::{navigate, show_window};

use tauri::menu::{Menu, MenuEvent, MenuItem};
use tauri::{Manager, Runtime};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent, TrayIcon};

pub fn setup<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let icon = app.default_window_icon().unwrap().clone();

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

    fn handle_tray_icon_event<R: Runtime>(tray: &TrayIcon<R>, event: &TrayIconEvent) {
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
