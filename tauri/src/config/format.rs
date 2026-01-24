use crate::config::{
    N8N_HOST, N8N_PORT, N8N_REST_ENDPOINT, APP_SERVER_BIND_ADDRESS, APP_SERVER_PORT,
    GITHUB_PROXY_PREFIX
};

/// 获取 n8n 基础 URL
pub fn n8n_base_url() -> String {
  format!("{}:{}", N8N_HOST, N8N_PORT)
}

/// 获取 n8n REST API URL
pub fn n8n_rest_url() -> String {
  format!("{}{}", n8n_base_url(), N8N_REST_ENDPOINT)
}

/// 获取应用服务器绑定地址
pub fn app_server_bind_address() -> String {
  format!("{}:{}", APP_SERVER_BIND_ADDRESS, APP_SERVER_PORT)
}

/// 获取应用服务器 URL
pub fn app_server_url() -> String {
  format!("http://localhost:{}", APP_SERVER_PORT)
}

/// 获取 GitHub 代理 URL（用于代理 GitHub 资源）
pub fn github_proxy_url(path: String) -> String {
  format!("{}{}", GITHUB_PROXY_PREFIX, path)
}
