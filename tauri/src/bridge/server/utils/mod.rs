use crate::config;
use tokio::net::TcpListener;

/// 创建 TCP 监听器，优先尝试 IPv6 双栈绑定，失败时回退到 IPv4
///
/// 使用 [::] 可以同时监听 IPv4 和 IPv6（在支持双栈的系统上）
/// 这样可以解决 n8n 连接 IPv6 localhost (::1) 的问题
pub async fn listen() -> Result<TcpListener, String> {
    let bind_address = config::get_app_server_url();
    let bind_address_v6 = format!("[::]:{}", config::APP_SERVER_PORT);

    // 尝试绑定 IPv6 地址（在支持双栈的系统上，这会同时监听 IPv4 和 IPv6）
    match TcpListener::bind(&bind_address_v6).await {
        Ok(listener) => {
            log::info!(
                "Axum Service Started on [::]:{} (dual-stack)",
                config::APP_SERVER_PORT
            );
            Ok(listener)
        }
        Err(e) => {
            log::warn!(
                "Failed to bind IPv6 [::]:{}, trying IPv4: {}",
                config::APP_SERVER_PORT,
                e
            );
            // 如果 IPv6 绑定失败，回退到 IPv4
            match TcpListener::bind(&bind_address).await {
                Ok(listener) => {
                    log::info!("Axum Service Started on {} (IPv4 only)", bind_address);
                    Ok(listener)
                }
                Err(e) => {
                    let error_msg = format!("Failed to Bind {}: {}. Possible Reasons: Port Occupied or Permission Denied", bind_address, e);
                    log::error!("{}", error_msg);
                    Err(error_msg)
                }
            }
        }
    }
}
