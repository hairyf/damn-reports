use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, serde::Serialize, PartialEq)]
pub enum N8nStatus {
    Initial,
    Starting,
    Running,
}

pub struct N8nState(pub Mutex<N8nStatus>);

#[tauri::command]
pub fn get_n8n_status(state: State<N8nState>) -> N8nStatus {
    state.0.lock().unwrap().clone()
}

/// 启动 n8n 进程
pub fn start_n8n(state: &State<N8nState>) {
    // 仅在开发环境下执行
    if !cfg!(debug_assertions) {
        // TODO: 生产环境启动逻辑
        return;
    }

    *state.0.lock().unwrap() = N8nStatus::Starting;

    if let Some(dir) = get_n8n_process_dir() {
        match spawn_npx_command(&dir, "n8n") {
            Ok(_) => {
                *state.0.lock().unwrap() = N8nStatus::Running;
            }
            Err(e) => {
                eprintln!("Failed to spawn n8n process: {}", e);
                 // Keep as Starting or revert to Initial? Let's keep it as Starting (failed) or maybe add a Failed state later. 
                 // For now, per requirements: initial, starting, running.
                 // If it fails, maybe revert to Initial?
                 *state.0.lock().unwrap() = N8nStatus::Initial;
            }
        }
    } else {
        eprintln!("Could not find n8n-process directory.");
        *state.0.lock().unwrap() = N8nStatus::Initial;
    }
}

/// 抽象跨平台的 npx 调用逻辑
fn spawn_npx_command(working_dir: &Path, arg: &str) -> std::io::Result<Child> {
    let (cmd, args) = if cfg!(target_os = "windows") {
        ("cmd", vec!["/C", "npx", arg])
    } else {
        ("npx", vec![arg])
    };

    Command::new(cmd)
        .args(&args)
        .current_dir(working_dir)
        .spawn()
}

/// 获取 n8n-process 目录路径
fn get_n8n_process_dir() -> Option<PathBuf> {
    let current_dir = std::env::current_dir().ok()?;
    
    // 尝试几种可能的路径
    let candidates = vec![
        current_dir.join("sidecar-app").join("n8n-process"),
        current_dir.parent().map(|p| p.join("sidecar-app").join("n8n-process")).unwrap_or_default(),
        // 原始逻辑保留作为备选，但加上 correct path
        current_dir.parent().map(|p| p.join("n8n-process")).unwrap_or_default(), 
    ];

    for path in candidates {
        if path.exists() {
            return Some(path);
        }
    }
    
    None
}