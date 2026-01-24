use std::fs;
use std::path::PathBuf;
use futures_util::StreamExt;

use crate::services::download::ProgressTracker;
use tauri::Runtime;

/// 下载文件到指定路径
/// 
/// # 参数
/// - `url`: 要下载的文件 URL
/// - `dest`: 目标文件路径
/// 
/// # 返回
/// 成功返回 `Ok(())`，失败返回错误信息
pub async fn download_file<'a, R: Runtime>(
    tracker: &'a ProgressTracker<'a, R>,
    url: String
) -> Result<Vec<u8>, String> {
    // 创建具备 User-Agent 的客户端
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    
    if !res.status().is_success() {
        return Err(format!("下载失败: HTTP {}", res.status()));
    }

    // 下载流处理并写入文件
    let total_size = res.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();
    let mut buffer = Vec::new();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;
        tracker.update(
            downloaded as f64 / total_size as f64, 
            format!("已下载 {:.1} MB / {:.1} MB", 
                downloaded as f64 / 1_000_000.0,
                total_size as f64 / 1_000_000.0)
        );
    }
    Ok(buffer)
}

/// 确保解压文件 or 文件到指定目录
/// 
/// # 参数
/// - `tracker`: 进度追踪器
/// - `buffer`: 压缩文件内容
/// - `dest`: 解压目标目录
/// 
/// # 返回
/// 成功返回 `Ok(())`，失败返回错误信息
pub fn ensure_extract<'a, R: Runtime>(
    tracker: &'a ProgressTracker<'a, R>,
    name: String,
    buffer: Vec<u8>,
    dest: PathBuf,
) -> Result<(), String> {
    use super::extractor::{extract_zip, extract_tgz};
    use super::utils::flatten_directory;

    // 判断文件类型
    let pure_name = name.split('?').next().unwrap_or(&name).to_lowercase();
    let is_tgz = pure_name.ends_with(".tar.gz") || pure_name.ends_with(".tgz");
    let is_zip = pure_name.ends_with(".zip");

    // 目标是文件，跳过，直接写入文件
    if !is_tgz && !is_zip {
         if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&dest, &buffer).map_err(|e| e.to_string())?;
        tracker.update(100.0, format!("已写入文件: {}", dest.display()));
        return Ok(());
    }

    // 清理并准备目标目录
    if dest.exists() {
        fs::remove_dir_all(&dest).ok();
    }
    fs::create_dir_all(&dest).map_err(|e| e.to_string())?;

    // 根据文件类型解压
    if is_tgz {
        extract_tgz(tracker, &buffer, &dest)?;
    } else {
        extract_zip(tracker, &buffer, &dest)?;
    }

    // 处理解压后的"套娃"文件夹
    flatten_directory(&dest)?;

    // 权限修复与隔离属性移除 (仅限 Unix/macOS)
    #[cfg(unix)]
    {
        use super::utils::fix_recursive_permissions;
        // 递归赋予可执行权限 (755)
        fix_recursive_permissions(&dest).map_err(|e| format!("权限修复失败: {}", e))?;
        
        // 如果是 macOS，移除 Quarantine 属性，防止系统拦截二进制文件执行
        #[cfg(target_os = "macos")]
        {
            let _ = std::process::Command::new("xattr")
                .args(["-cr", dest.to_str().unwrap()])
                .spawn();
        }
    }

    tracker.update(100.0, format!("已解压文件: {}", dest.display()));
    Ok(())
}
