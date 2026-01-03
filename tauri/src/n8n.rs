use std::path::{Path, PathBuf};
use std::process::{Child, Command};

/// 启动 n8n 进程
pub fn start_n8n() {
    // 仅在开发环境下执行
    if !cfg!(debug_assertions) {
        // TODO: 生产环境启动逻辑
        return;
    }

    if let Some(dir) = get_n8n_process_dir() {
        let _ = spawn_npx_command(&dir, "n8n")
        .map_err(|e| {
          // 如果是 OS 找不到 npx 命令，这里会报错
          eprintln!("Critical: Could not path npx: {}", e);
      });
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
    std::env::current_dir()
        .ok()
        .and_then(|path| path.parent().map(|p| p.to_path_buf())) // 返回上一级目录
        .map(|base| base.join("n8n-process"))
        .filter(|p| p.exists())
}