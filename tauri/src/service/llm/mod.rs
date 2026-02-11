pub mod prompt;

use tauri::AppHandle;
use sea_orm::{DatabaseConnection, EntityTrait};
use std::sync::Arc;
use crate::config;
use crate::bridge::server::routes::record::{service as record_service, dtos::RecordType};
use crate::bridge::server::routes::report::{service as report_service, dtos::{ReportCreateInput, ReportType}};
use crate::core::db::entities::workspace;
use serde_json::json;
use chrono::Local;

pub async fn generate_daily_report(app_handle: &AppHandle, db: DatabaseConnection) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let setting = config::get_store_dat_setting(app_handle);
    let db_arc = Arc::new(db);

    // 0. Get Workspace ID
    let workspace = workspace::Entity::find().one(db_arc.as_ref()).await?;
    let workspace_id = workspace.map(|w| w.id).ok_or("No workspace found")?;

    // 1. Get Summary Data
    // We pass None for workspace_id to get all records or we should pass the workspace_id?
    // record_service::get_summary_prompt expects Option<String> for workspace_id filter.
    // If we want to filter by workspace, we should pass it.
    let summary_data = record_service::get_summary_prompt(db_arc.clone(), &RecordType::Daily, Some(workspace_id.to_string())).await?;

    if summary_data == "No record data available." || summary_data.is_empty() {
        log::info!("No data to report");
        return Ok(());
    }

    // 2. Prepare Prompt
    let full_prompt = prompt::DAILY_REPORT_PROMPT.replace("{{ JSON.stringify($json.data) }}", &summary_data);

    // 3. Call LLM
    let client = reqwest::Client::new();
    let api_key = if setting.is_llm_env_configured {
        std::env::var("LLM_API_KEY").unwrap_or(setting.llm_api_key)
    } else {
        setting.llm_api_key
    };
    
    let base_url = if setting.is_llm_env_configured {
        std::env::var("LLM_BASE_URL").unwrap_or(setting.llm_base_url)
    } else {
        setting.llm_base_url
    };

    if api_key.is_empty() {
        log::error!("LLM API Key is missing");
        return Err("LLM API Key is missing".into());
    }

    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let payload = json!({
        "model": setting.llm_model,
        "messages": [
            {
                "role": "system",
                "content": full_prompt
            }
        ],
        "stream": false
    });

    log::info!("Sending request to LLM: {}", url);
    let response = client.post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    if !response.status().is_success() {
        let error_text = response.text().await?;
        log::error!("LLM Request Failed: {}", error_text);
        return Err(format!("LLM Request Failed: {}", error_text).into());
    }

    let response_json: serde_json::Value = response.json().await?;
    let content = response_json["choices"][0]["message"]["content"].as_str().unwrap_or("").to_string();

    log::info!("Report generated successfully. Length: {}", content.len());

    // 4. Save Report
    let report_input = ReportCreateInput {
        name: Some(format!("日报 {}", Local::now().format("%Y-%m-%d"))),
        r#type: Some(ReportType::Daily),
        content: content,
        workspace_id: workspace_id,
    };

    report_service::create_report(db_arc, app_handle.clone(), report_input).await?;

    Ok(())
}
