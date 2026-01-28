use crate::config;
use tokio::net::TcpListener;

/// 创建 TCP 监听器，优先尝试 IPv4 绑定以确保兼容性
///
/// 在 Windows 上，优先使用 IPv4 (0.0.0.0) 以确保 n8n 等工具可以正常连接
/// 如果 IPv4 绑定失败，再尝试 IPv6 双栈绑定
pub async fn listen() -> Result<TcpListener, String> {
    let bind_address = config::get_app_server_url();
    let bind_address_v6 = format!("[::]:{}", config::APP_SERVER_PORT);

    // 优先尝试 IPv4 绑定（在 Windows 上更可靠）
    match TcpListener::bind(&bind_address).await {
        Ok(listener) => {
            log::info!("Axum Service Started on {} (IPv4)", bind_address);
            Ok(listener)
        }
        Err(e) => {
            log::warn!("Failed to bind IPv4 {}, trying IPv6: {}", bind_address, e);
            // 如果 IPv4 绑定失败，尝试 IPv6 双栈绑定
            match TcpListener::bind(&bind_address_v6).await {
                Ok(listener) => {
                    log::info!(
                        "Axum Service Started on [::]:{} (IPv6 dual-stack)",
                        config::APP_SERVER_PORT
                    );
                    Ok(listener)
                }
                Err(e2) => {
                    let error_msg = format!(
                        "Failed to Bind both IPv4 {} and IPv6 [::]:{}. IPv4 Error: {}, IPv6 Error: {}. Possible Reasons: Port Occupied or Permission Denied",
                        bind_address, config::APP_SERVER_PORT, e, e2
                    );
                    log::error!("{}", error_msg);
                    Err(error_msg)
                }
            }
        }
    }
}
