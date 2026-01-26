use std::io::{BufRead, BufReader};
use std::net::{SocketAddr, TcpStream};
use std::process::{ChildStderr, ChildStdout};
use std::thread;
use std::time::Duration;

/// 检查 n8n 是否真正在运行
pub async fn is_n8n_running() -> bool {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .ok(); // 将 Result 转为 Option

    // 如果 client 创建失败，直接返回 false
    let client = match client {
        Some(c) => c,
        None => return false,
    };

    // n8n 的 healthz 端点在根路径，不在 /rest 下
    use crate::config::{N8N_HOST, N8N_PORT};
    let healthz_url = format!("{}:{}/healthz", N8N_HOST, N8N_PORT);

    // 发送请求并尝试解析 JSON
    let check_status = async {
        let resp = client.get(&healthz_url).send().await.ok()?;

        if resp.status() != reqwest::StatusCode::OK {
            return None;
        }

        let json: serde_json::Value = resp.json().await.ok()?;
        Some(json["status"] == "ok")
    };

    check_status.await.unwrap_or(false)
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
        Ok(_) => true,   // 连接成功，端口被占用（有服务在监听）
        Err(_) => false, // 连接失败或超时，端口未被占用
    }
}

/// 在独立线程中读取子进程的输出
///
/// # 参数
/// - `stdout`: 子进程的标准输出
/// - `stderr`: 子进程的标准错误输出
pub fn spawn_output_readers(stdout: Option<ChildStdout>, stderr: Option<ChildStderr>) {
    // 在独立线程中读取 stdout
    if let Some(stdout) = stdout {
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                match line {
                    Ok(line) => {
                        log::info!("[n8n::stdout]: {}", line);
                    }
                    Err(e) => {
                        log::error!("Failed to read n8n stdout: {}", e);
                        break;
                    }
                }
            }
        });
    }

    // 在独立线程中读取 stderr
    if let Some(stderr) = stderr {
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                match line {
                    Ok(line) => {
                        log::warn!("[n8n::stderr]: {}", line);
                    }
                    Err(e) => {
                        log::error!("Failed to read n8n stderr: {}", e);
                        break;
                    }
                }
            }
        });
    }
}
