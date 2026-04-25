use std::sync::mpsc; // 重新引入通道用于跨线程获取结果
use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager};
use tauri_utils::config::WebviewUrl;

#[tauri::command]
pub async fn create_webview(
    app_handle: AppHandle,
    label: String,
    url: String,
    x: Option<i32>,
    y: Option<i32>,
    width: Option<i32>,
    height: Option<i32>,
) -> Result<String, String> {
    let parsed_url = url.parse().map_err(|e| format!("URL 解析失败: {}", e))?;
    let main_window = app_handle.get_window("main").ok_or_else(|| "未找到主窗口".to_string())?;
    
    // 准备构建器
    let webview_builder = tauri::webview::WebviewBuilder::new(&label, WebviewUrl::External(parsed_url))
        .transparent(true)
        .auto_resize();

    // 创建同步通道
    let (tx, rx) = mpsc::channel();
    let label_inner = label.clone();

    // 在主线程执行 UI 挂载
    app_handle.run_on_main_thread(move || {
        let result = main_window
            .add_child(
                webview_builder,
                LogicalPosition::new(x.unwrap_or(0), y.unwrap_or(0)),
                LogicalSize::new(width.unwrap_or(0), height.unwrap_or(0)),
            )
            .map(|_| label_inner) // 成功则返回 label
            .map_err(|e| e.to_string());
        let _ = tx.send(result); // 将结果发回异步线程
    }).map_err(|e| e.to_string())?;

    // 等待主线程返回结果
    rx.recv().map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn resize_webview(
    app_handle: AppHandle,
    label: String,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
) -> Result<(), String> {
    let webview = find_webview(&app_handle, &label)?;
    webview.set_position(LogicalPosition::new(x, y)).map_err(|e| e.to_string())?;
    webview.set_size(LogicalSize::new(width, height)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn close_webview(app_handle: AppHandle, label: String) -> Result<(), String> {
    let webview = find_webview(&app_handle, &label)?;
    webview.close().map_err(|e| e.to_string())
}

fn find_webview(app_handle: &AppHandle, label: &str) -> Result<tauri::Webview, String> {
    app_handle
        .get_webview(label)
        .ok_or_else(|| format!("未找到 Webview: {}", label))
}