use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::net::{TcpStream, SocketAddr};
use std::time::Duration;

/// 抽象跨平台的 npx 调用逻辑
pub fn spawn_npx_command(working_dir: &Path, arg: &str) -> std::io::Result<Child> {
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
pub fn get_n8n_process_dir() -> Option<PathBuf> {
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

/// 检查指定端口是否被占用（通过尝试连接来判断）
pub fn is_port_in_use(port: u16) -> bool {
    // 尝试连接到端口，设置较短的超时时间（100ms）以快速检测
    // 如果能连接成功，说明端口有服务在监听
    let addr: SocketAddr = format!("127.0.0.1:{}", port).parse().unwrap_or_else(|_| {
        // 如果解析失败，返回一个默认地址（虽然不太可能发生）
        "127.0.0.1:0".parse().unwrap()
    });
    
    match TcpStream::connect_timeout(&addr, Duration::from_millis(100)) {
        Ok(_) => true,  // 连接成功，端口被占用（有服务在监听）
        Err(_) => false, // 连接失败或超时，端口未被占用
    }
}

/// 检查 n8n 是否真正在运行（通过 HTTP 请求 /rest 端点）
/// 如果返回 404，说明 n8n 服务正常运行
pub async fn is_n8n_running() -> bool {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build();
    
    match client {
        Ok(client) => {
            match client.get("http://localhost:5678/rest").send().await {
                Ok(response) => {
                    // 如果返回 404，说明 n8n 服务正常运行（/rest 端点不存在是正常的）
                    response.status() == reqwest::StatusCode::NOT_FOUND
                }
                Err(_) => false, // 请求失败，说明服务未运行
            }
        }
        Err(_) => false, // 客户端构建失败
    }
}