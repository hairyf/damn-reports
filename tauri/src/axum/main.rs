
use axum::{
  routing::{get, post},
  Router,
  response::Json,
};
use tokio::net::TcpListener;
use sea_orm::DatabaseConnection;
use std::sync::Arc;
use serde_json::json;
use crate::axum::modules;

pub fn start(db: DatabaseConnection) {
  tauri::async_runtime::spawn(create_server(db));
}

/// 启动 Axum 服务器
pub async fn create_server(db: DatabaseConnection) {
  let app = Router::new()
    .route("/", get(root))
    .route("/health", get(health))
    .route("/record", get(modules::record::get))
    .route("/report", post(modules::report::post))
    .with_state(Arc::new(db));
  
  match TcpListener::bind("0.0.0.0:6789").await {
    Ok(listener) => {
      println!("✓ Axum Service Started: http://localhost:6789");
      println!("  Available Routes:");
      println!("    GET  /          - Root Path");
      println!("    GET  /health    - Health Check");
      println!("    GET  /record    - Get Records");
      println!("    POST /report    - Create Report");
      
      if let Err(e) = axum::serve(listener, app).await {
        eprintln!("✗ Axum Service Error: {}", e);
      }
    }
    Err(e) => {
      eprintln!("✗ Failed to Bind Port 6789: {}", e);
      eprintln!("  Possible Reasons: Port Occupied or Permission Denied");
    }
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
      "report": "POST /report"
    }
  }))
}

/// 健康检查处理器
async fn health() -> &'static str {
  "OK"
}
