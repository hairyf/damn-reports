use crate::config::{get_n8n_base_url, N8N_WEBHOOK_ID};

/// 触发 n8n workflow webhook
/// 
/// 发送 GET 请求到 n8n webhook URL 以触发工作流执行
/// 
/// # Returns
/// 
/// - `Ok(())`: webhook 调用成功
/// - `Err(String)`: webhook 调用失败，包含错误信息
pub async fn trigger() -> Result<(), Box<dyn std::error::Error>> {
  let webhook_url = format!("{}/webhook/{}", get_n8n_base_url(), N8N_WEBHOOK_ID);
  
  log::info!("Triggering n8n workflow webhook: {}", webhook_url);
  
  let client = reqwest::Client::new();
  let response = client
    .get(&webhook_url)
    .send()
    .await?;
  
  if !response.status().is_success() {
    log::error!("n8n webhook request failed with status: {}", response.status());
    return Err(format!(
      "n8n webhook request failed with status: {}",
      response.status()
    ).into());
  }
  
  log::info!("n8n workflow webhook triggered successfully");
  Ok(())
}
