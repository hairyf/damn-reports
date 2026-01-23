use std::net::{TcpStream, SocketAddr};
use std::time::Duration;

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
