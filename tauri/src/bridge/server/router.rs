use crate::bridge::server::routes;
use crate::bridge::server::utils;
use axum::{
    response::Json,
    routing::{get, post},
    Router,
};
use sea_orm::DatabaseConnection;
use serde_json::json;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

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

    // 配置 CORS 中间件，允许所有来源
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/record", get(routes::record::get))
        .route("/record/collect", post(routes::record::post_collect))
        .route("/record/summary", get(routes::record::get_summary))
        .route("/report", post(routes::report::post))
        .layer(cors)
        .with_state(app_state);

    let listener = utils::listen().await.unwrap();
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
        "recordCollect": "POST /record/collect",
        "recordSummary": "GET /record/summary?type=daily",
        "report": "POST /report"
      }
    }))
}

/// 健康检查处理器
async fn health() -> &'static str {
    "OK"
}
