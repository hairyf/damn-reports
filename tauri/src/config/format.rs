use crate::config::{APP_SERVER_BIND_ADDRESS, APP_SERVER_PORT};

/// 获取应用服务器绑定地址
pub fn get_app_server_url() -> String {
    format!("{}:{}", APP_SERVER_BIND_ADDRESS, APP_SERVER_PORT)
}
