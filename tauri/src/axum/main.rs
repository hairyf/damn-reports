
use axum::{
  routing::{get, post},
  Router,
  response::Json,
};
use tokio::net::TcpListener;
use sea_orm::DatabaseConnection;
use std::sync::Arc;
use serde_json::json;
use crate::axum::routes;

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
  
  match TcpListener::bind("0.0.0.0:6789").await {
    Ok(listener) => {
      println!("✓ Axum Service Started: http://localhost:6789");
      
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
      "recordSummary": "GET /record/summary?type=daily",
      "report": "POST /report"
    }
  }))
}

/// 健康检查处理器
async fn health() -> &'static str {
  "OK"
}
