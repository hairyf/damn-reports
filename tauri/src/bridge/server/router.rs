
use axum::{
  routing::{get, post},
  Router,
  response::Json,
};
use tokio::net::TcpListener;
use sea_orm::DatabaseConnection;
use std::sync::Arc;
use serde_json::json;
use crate::bridge::server::routes;
use crate::config::{app_server_bind_address, APP_SERVER_PORT};

/// Axum 应用状态
#[derive(Clone)]
pub struct AppState {
  pub db: Arc<DatabaseConnection>,
  pub app_handle: tauri::AppHandle,
}

/// 启动 Axum 服务器
pub async fn start(db: DatabaseConnection, app_handle: tauri::AppHandle) {
  let app_state = AppState {
    db: Arc::new(db),
    app_handle,
  };
  
  let app = Router::new()
    .route("/", get(root))
    .route("/health", get(health))
    .route("/record", get(routes::record::get))
    .route("/record/summary", get(routes::record::get_summary))
    .route("/report", post(routes::report::post))
    .with_state(app_state);
  
  let bind_address = app_server_bind_address();
  
  // 使用 [::] 可以同时监听 IPv4 和 IPv6（在支持双栈的系统上）
  // 这样可以解决 n8n 连接 IPv6 localhost (::1) 的问题
  let bind_address_v6 = format!("[::]:{}", APP_SERVER_PORT);
  
  // 尝试绑定 IPv6 地址（在支持双栈的系统上，这会同时监听 IPv4 和 IPv6）
  let listener = match TcpListener::bind(&bind_address_v6).await {
    Ok(listener) => {
      log::info!("Axum Service Started on [::]:{} (dual-stack)", APP_SERVER_PORT);
      listener
    }
    Err(e) => {
      log::warn!("Failed to bind IPv6 [::]:{}, trying IPv4: {}", APP_SERVER_PORT, e);
      // 如果 IPv6 绑定失败，回退到 IPv4
      match TcpListener::bind(&bind_address).await {
        Ok(listener) => {
          log::info!("Axum Service Started on {} (IPv4 only)", bind_address);
          listener
        }
        Err(e) => {
          log::error!("Failed to Bind {}: {}", bind_address, e);
          log::error!("Possible Reasons: Port Occupied or Permission Denied");
          return;
        }
      }
    }
  };

  if let Err(e) = axum::serve(listener, app).await {
    log::error!("Axum Service Error: {}", e);
  }
}

/// 根路径处理器
async fn root() -> Json<serde_json::Value> {
  Json(json!({
    "message": "Axum API Server",
    "version": "1.0.0",
    "endpoints": {
      "health": "GET /health",
      "record": "GET /record?type=daily",
      "recordSummary": "GET /record/summary?type=daily",
      "report": "POST /report"
    }
  }))
}

/// 健康检查处理器
async fn health() -> &'static str {
  "OK"
}
