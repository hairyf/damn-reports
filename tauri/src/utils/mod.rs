use tauri::{Runtime, WebviewWindow};

pub fn show_window<R: Runtime>(window: &WebviewWindow<R>) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}

pub fn navigate<R: Runtime>(window: &WebviewWindow<R>, path: &str) {
    let _ = window.eval(&format!("window.location.href = '{}'", path));
}
