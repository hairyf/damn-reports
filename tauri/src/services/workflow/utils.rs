use std::time::Duration;
use crate::config::n8n_base_url;

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

    let healthz_url = format!("{}/healthz", n8n_base_url());

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