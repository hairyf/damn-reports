use crate::config::{APP_SERVER_BIND_ADDRESS, APP_SERVER_PORT, N8N_HOST, N8N_PORT};

/// 获取 n8n 基础 URL
pub fn get_n8n_base_url() -> String {
    format!("{}:{}", N8N_HOST, N8N_PORT)
}

// /// 获取 n8n REST API URL
// pub fn n8n_rest_url() -> String {
//   format!("{}{}", get_n8n_base_url(), N8N_REST_ENDPOINT)
// }

/// 获取应用服务器绑定地址
pub fn get_app_server_url() -> String {
    format!("{}:{}", APP_SERVER_BIND_ADDRESS, APP_SERVER_PORT)
}
