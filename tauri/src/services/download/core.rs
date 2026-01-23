use std::fs;
use std::path::PathBuf;
use std::time::{Instant, Duration};
use tauri::{Emitter, Runtime, Window};
use futures_util::StreamExt;

use super::models::{Progress, ExtractionStart};
use super::extractor::{extract_zip, extract_tgz};
use super::utils::flatten_directory;

#[cfg(unix)]
use super::utils::fix_recursive_permissions;

pub async fn download_file<R: Runtime>(
    window: Window<R>,
    url: String,
    dest: PathBuf,
    r#type: String,
) -> Result<(), String> {
    // 1. 创建具备 User-Agent 的客户端
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    
    if !res.status().is_success() {
        return Err(format!("下载失败: HTTP {}", res.status()));
    }

    let total = res.content_length().unwrap_or(0);
    let mut downloaded = 0;
    let mut stream = res.bytes_stream();
    let mut buffer = Vec::new();

    let mut last_emit_time = Instant::now();
    let mut last_emit_progress = -1.0;

    // 3. 下载流处理
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        buffer.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;
        
        if total > 0 {
            let progress = (downloaded as f64 / total as f64) * 100.0;
            if progress - last_emit_progress >= 0.5 || last_emit_time.elapsed() >= Duration::from_millis(150) {
                let _ = window.emit("download-progress", Progress {
                    r#type: r#type.clone(),
                    progress,
                });
                last_emit_progress = progress;
                last_emit_time = Instant::now();
            }
        }
    }

    // 4. 判断目标是文件还是目录
    let pure_url = url.split('?').next().unwrap_or(&url).to_lowercase();
    let is_archive = pure_url.ends_with(".tar.gz") || pure_url.ends_with(".tgz") || pure_url.ends_with(".zip");
    
    // 判断 dest 是文件还是目录：如果以存档扩展名结尾且看起来像文件名，则保存为文件
    let dest_is_file = dest.extension().is_some() && dest.parent().is_some();
    
    if is_archive && !dest_is_file {
        // dest 是目录：清理并准备目录，然后解压
        if dest.exists() {
            fs::remove_dir_all(&dest).ok();
        }
        fs::create_dir_all(&dest).map_err(|e| e.to_string())?;

        // 发送解压开始事件
        let _ = window.emit("extraction-start", ExtractionStart {
            r#type: r#type.clone(),
        });

        // 根据后缀名解压
        if pure_url.ends_with(".tar.gz") || pure_url.ends_with(".tgz") {
            extract_tgz(&buffer, &dest)?;
        } else {
            extract_zip(&buffer, &dest)?;
        }

        // 处理解压后的"套娃"文件夹
        flatten_directory(&dest)?;
    } else {
        // 目标是文件：写入文件
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&dest, &buffer).map_err(|e| e.to_string())?;
    }

    // --- 新增：7. 权限修复与隔离属性移除 (仅限 Unix/macOS) ---
    // 仅当解压了存档时才执行权限修复
    if is_archive && !dest_is_file {
        #[cfg(unix)]
        {
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
    }

    // 8. 完成
    let _ = window.emit("download-progress", Progress {
        progress: 100.0,
        r#type: r#type.clone(),
    });
    Ok(())
}
