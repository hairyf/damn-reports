use serde::{Deserialize, Serialize};
use chrono::{FixedOffset, Utc, TimeZone};
use crate::config::CLICKUP_API_URL;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClickupTask {
    pub id: String,
    pub name: String,
    pub status: ClickupStatus,
    pub list: Option<ClickupList>,
    pub date_updated: Option<String>, // ClickUp 有时返回字符串，确保与 API 匹配
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClickupStatus { pub status: String }

#[derive(Debug, Serialize, Deserialize)]
pub struct ClickupList { pub name: String }

#[derive(Debug, Serialize, Deserialize)]
struct ClickupResponse { tasks: Vec<ClickupTask> }

#[derive(Debug, Serialize)]
pub struct CollectClickupResult {
    pub data: Vec<ClickupTask>,
    pub count: usize,
}

pub async fn daily(
    token: String,
    team: String,
    user: String,
) -> Result<CollectClickupResult, String> {
    log::info!("Starting ClickUp record collection: team={}, user={}", team, user);
    // 1. 简洁的时间计算 (北京时间今日 00:00:00 起)
    let offset = FixedOffset::east_opt(8 * 3600).unwrap();
    let today = Utc::now().with_timezone(&offset).date_naive();
    
    let start_of_day = offset.from_local_datetime(&today.and_hms_opt(0, 0, 0).unwrap()).unwrap().timestamp_millis();
    let end_of_day = offset.from_local_datetime(&today.and_hms_opt(23, 59, 59).unwrap()).unwrap().timestamp_millis();
    log::debug!("Collection time range: {} - {}", start_of_day, end_of_day);

    // 2. 使用 reqwest 内置的 Query 序列化
    // ClickUp 的 assignees[] 这种特殊格式可以直接写在 query 中
    let query_params = [
        ("include_closed", "true"),
        ("subtasks", "true"),
        ("date_updated_gt", &start_of_day.to_string()),
        ("date_updated_lt", &end_of_day.to_string()),
        ("assignees[]", &user),
    ];

    let url = format!("{}/team/{}/task", CLICKUP_API_URL, team);
    log::debug!("Requesting ClickUp API: {}", url);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", token)
        .query(&query_params)
        .send()
        .await
        .map_err(|e| {
            log::error!("ClickUp API request failed: {}", e);
            e.to_string()
        })?;

    // 3. 错误处理与解析
    if !response.status().is_success() {
        log::error!("ClickUp API error: {}", response.status());
        return Err(format!("ClickUp API error: {}", response.status()));
    }

    let data: ClickupResponse = response.json().await.map_err(|e| {
        log::error!("Failed to parse ClickUp response: {}", e);
        e.to_string()
    })?;

    log::info!("Collection completed, {} tasks total", data.tasks.len());
    Ok(CollectClickupResult {
        count: data.tasks.len(),
        data: data.tasks,
    })
}
