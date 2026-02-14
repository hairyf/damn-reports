use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Manager};

/// Resolve path: 绝对路径直接使用（需在 resource_dir 内），相对路径基于 resource_dir
fn resolve_in_resource(app: &AppHandle, path: &str) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let path_buf = Path::new(path);

    for segment in path.split(['/', '\\']) {
        if segment == ".." {
            return Err("Path traversal not allowed".to_string());
        }
    }

    if path_buf.is_absolute() {
      Ok(path_buf.to_path_buf())
    } else {
      Ok(resource_dir.join("workspace").join(path))
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntry {
    name: String,
    is_directory: bool,
    is_file: bool,
    is_symlink: bool,
}

#[tauri::command]
pub async fn fs_exists(app: AppHandle, path: String) -> Result<bool, String> {
    let full = resolve_in_resource(&app, &path)?;
    Ok(full.exists())
}

#[tauri::command]
pub async fn fs_read_file(app: AppHandle, path: String) -> Result<Vec<u8>, String> {
    let full = resolve_in_resource(&app, &path)?;
    fs::read(&full).map_err(|e| format!("Read file failed: {}", e))
}

#[tauri::command]
pub async fn fs_write_file(app: AppHandle, path: String, data: Vec<u8>) -> Result<(), String> {
    let full = resolve_in_resource(&app, &path)?;
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create dir failed: {}", e))?;
    }
    fs::write(&full, data).map_err(|e| format!("Write file failed: {}", e))
}

#[tauri::command]
pub async fn fs_read_text_file(app: AppHandle, path: String) -> Result<String, String> {
    let full = resolve_in_resource(&app, &path)?;
    fs::read_to_string(&full).map_err(|e| format!("Read text file failed: {}", e))
}

#[tauri::command]
pub async fn fs_write_text_file(app: AppHandle, path: String, data: String) -> Result<(), String> {
    let full = resolve_in_resource(&app, &path)?;
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create dir failed: {}", e))?;
    }
    fs::write(&full, data).map_err(|e| format!("Write text file failed: {}", e))
}

#[tauri::command]
pub async fn fs_read_dir(
    app: AppHandle,
    path: String,
    recursive: Option<bool>,
) -> Result<Vec<DirEntry>, String> {
    let full = resolve_in_resource(&app, &path)?;
    let mut result = Vec::new();
    let read_recursive = recursive.unwrap_or(false);

    fn collect_entries(
        base: &PathBuf,
        prefix: &str,
        recursive: bool,
        result: &mut Vec<DirEntry>,
    ) -> Result<(), String> {
        let entries = fs::read_dir(base).map_err(|e| format!("Read dir failed: {}", e))?;
        for entry in entries {
            let entry = entry.map_err(|e| format!("Read entry failed: {}", e))?;
            let metadata = entry.metadata().map_err(|e| format!("Metadata failed: {}", e))?;
            let is_symlink = entry.path().is_symlink();
            let is_directory = if is_symlink {
                fs::metadata(entry.path())
                    .map(|m| m.is_dir())
                    .unwrap_or(false)
            } else {
                metadata.is_dir()
            };
            let is_file = metadata.is_file();

            let name = entry.file_name().to_string_lossy().into_owned();
            let rel_name = if prefix.is_empty() {
                name.clone()
            } else {
                format!("{}/{}", prefix, name)
            };

            result.push(DirEntry {
                name: rel_name.clone(),
                is_directory: is_directory,
                is_file: is_file,
                is_symlink: is_symlink,
            });

            if recursive && is_directory && !is_symlink {
                let full_path = base.join(&name);
                collect_entries(&full_path, &rel_name, true, result)?;
            }
        }
        Ok(())
    }

    collect_entries(&full, "", read_recursive, &mut result)?;
    Ok(result)
}
