
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
use std::sync::atomic::{AtomicBool, Ordering};
use crate::database::connection;

// 全局标志，确保 database_loaded 只运行一次
static AXUM_STARTED_CALLED: AtomicBool = AtomicBool::new(false);

pub fn start(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  if AXUM_STARTED_CALLED.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
      return Ok(());
  }
  match connection::connect(app_handle) {
      Ok(db) => {
          println!("✓ Database Connection Successful");
          tauri::async_runtime::spawn(create_server(db));
          Ok(())
      }
      Err(e) => {
          AXUM_STARTED_CALLED.store(false, Ordering::SeqCst);
          eprintln!("✗ Database Connection Failed: {}", e);
          Ok(())
      }
  }
}

/// 启动 Axum 服务器
pub async fn create_server(db: DatabaseConnection) {
  let app = Router::new()
    .route("/", get(root))
    .route("/health", get(health))
    .route("/record", get(routes::record::get))
    .route("/report", post(routes::report::post))
    .with_state(Arc::new(db));
  
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
      "report": "POST /report"
    }
  }))
}

/// 健康检查处理器
async fn health() -> &'static str {
  "OK"
}
