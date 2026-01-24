use std::io::Cursor;
use std::path::PathBuf;

use std::fs;
use std::io::{copy};

use tauri::Runtime;

use crate::services::download::ProgressTracker;

pub fn extract_zip<'a, R: Runtime>(
    tracker: &ProgressTracker<'a, R>,
    buffer: &[u8],
    dest: &PathBuf,
) -> Result<(), String> {
    let mut archive = zip::ZipArchive::new(Cursor::new(buffer))
        .map_err(|e| format!("Zip格式非法: {}", e))?;

    let total_files = archive.len();

    for i in 0..total_files {
        // 1. 获取当前文件
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        
        // 2. 获取并清理输出路径（防止路径穿越漏洞）
        let outpath = match file.enclosed_name() {
            Some(path) => dest.join(path),
            None => continue,
        };

        // 3. 打印进度和当前文件名
        tracker.update(
            (i + 1) as f64 / total_files as f64,
            format!("{:?}", outpath.file_name().unwrap_or_default())
        );

        // 4. 处理目录或文件
        if (*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(&p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
            copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }

        // 设置权限（仅限 Unix 系统可选）
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = file.unix_mode() {
                fs::set_permissions(&outpath, fs::Permissions::from_mode(mode)).ok();
            }
        }
    }
    Ok(())
}

pub fn extract_tgz<'a, R: Runtime>(
    tracker: &ProgressTracker<'a, R>,
    buffer: &[u8],
    dest: &PathBuf,
) -> Result<(), String> {
    use flate2::read::GzDecoder;
    use tar::Archive;

    let tar_gz = GzDecoder::new(Cursor::new(buffer));
    let mut archive = Archive::new(tar_gz);

    // 使用 entries() 替代 unpack() 以便手动控制
    let entries = archive.entries().map_err(|e| e.to_string())?;

    for entry_result in entries {
        let mut entry = entry_result.map_err(|e| e.to_string())?;
        let path = entry.path().map(|p| p.to_path_buf()).map_err(|e| e.to_string())?;
        
        // 打印当前解压的文件名
        // -1.0 表示未知进度(让前端持续增加)
        tracker.update(-1.0, format!("{:?}", path));

        // 执行解压
        entry.unpack_in(dest).map_err(|e| e.to_string())?;
    }

    Ok(())
}