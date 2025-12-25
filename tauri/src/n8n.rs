use std::process::Command;

/// 启动 n8n 进程
pub fn start_n8n() {
    if cfg!(target_os = "windows") {
        let _ = Command::new("cmd")
            .args(&["/C", "npx", "n8n"])
            .spawn();
    } else {
        let _ = Command::new("npx")
            .args(&["n8n"])
            .spawn();
    }
}
