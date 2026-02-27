//! 工作区工具 / 定时任务导出与导入（.tool / .cron 为 zip 格式）

use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;

use serde_json::{Map, Value};
use tauri::{AppHandle, Manager};
use zip::write::FileOptions;
use zip::{ZipArchive, ZipWriter};

fn workspace_root(app: &AppHandle) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    Ok(resource_dir.join("workspace"))
}

/// 默认内置工具 ID，不允许导出
const BUILTIN_TOOL_IDS: &[&str] = &["git_directory", "clickup"];

fn read_workspace_json(app: &AppHandle, path: &str) -> Result<Value, String> {
    let root = workspace_root(app)?;
    let full = root.join(path);
    let s = fs::read_to_string(&full).map_err(|e| format!("Read {}: {}", path, e))?;
    serde_json::from_str(&s).map_err(|e| format!("Parse {}: {}", path, e))
}

fn write_workspace_json(app: &AppHandle, path: &str, value: &Value) -> Result<(), String> {
    let root = workspace_root(app)?;
    let full = root.join(path);
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create dir: {}", e))?;
    }
    let s = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    fs::write(&full, s).map_err(|e| format!("Write {}: {}", path, e))
}

/// 导出单个工具配置为 .tool（zip：index.json 仅含该 tool_id + 其 files）
#[tauri::command]
pub async fn workspace_export_tools(app: AppHandle, save_path: String, tool_id: String) -> Result<(), String> {
    let root = workspace_root(&app)?;
    let tools_path = root.join("tools.json");
    let tools: Value = serde_json::from_str(
        &fs::read_to_string(&tools_path).map_err(|e| format!("Read tools.json: {}", e))?,
    )
    .map_err(|e| format!("Parse tools.json: {}", e))?;

    let obj = tools.as_object().ok_or("tools.json is not an object")?;
    if BUILTIN_TOOL_IDS.contains(&tool_id.as_str()) {
        return Err(format!("Built-in tool '{}' cannot be exported", tool_id));
    }
    let tool = obj.get(&tool_id).ok_or_else(|| format!("Tool '{}' not found", tool_id))?;
    let mut index_obj = Map::new();
    index_obj.insert(tool_id.clone(), tool.clone());
    let index = Value::Object(index_obj);

    let mut files_to_add: Vec<String> = Vec::new();
    if let Some(arr) = tool.get("files").and_then(Value::as_array) {
        for f in arr {
            if let Some(s) = f.as_str() {
                files_to_add.push(s.to_string());
            }
        }
    }

    let out = fs::File::create(&save_path).map_err(|e| format!("Create file: {}", e))?;
    let mut zip = ZipWriter::new(out);
    let opts = FileOptions::default().unix_permissions(0o644);

    zip.start_file("index.json", opts).map_err(|e| e.to_string())?;
    zip.write_all(
        serde_json::to_string_pretty(&index).map_err(|e| e.to_string())?.as_bytes(),
    )
    .map_err(|e| e.to_string())?;

    for rel in &files_to_add {
        let full = root.join(rel);
        if full.exists() && full.is_file() {
            let content = fs::read(&full).map_err(|e| format!("Read {}: {}", rel, e))?;
            zip.start_file(rel, opts).map_err(|e| e.to_string())?;
            zip.write_all(&content).map_err(|e| e.to_string())?;
        }
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

/// 导入 .tool：解压并合并到 tools.json，写入附带 files，刷新由前端负责
#[tauri::command]
pub async fn workspace_import_tools(app: AppHandle, zip_path: String) -> Result<(), String> {
    let root = workspace_root(&app)?;
    let file = fs::File::open(&zip_path).map_err(|e| format!("Open zip: {}", e))?;
    let mut zip = ZipArchive::new(file).map_err(|e| format!("Invalid zip: {}", e))?;

    let mut index: Value = Value::Object(serde_json::Map::new());
    for i in 0..zip.len() {
        let mut entry = zip.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name().to_string();
        if name == "index.json" {
            let mut buf = String::new();
            entry.read_to_string(&mut buf).map_err(|e| e.to_string())?;
            index = serde_json::from_str(&buf).map_err(|e| format!("Parse index.json: {}", e))?;
            continue;
        }
        if entry.is_dir() {
            continue;
        }
        let rel = entry.name().replace('\\', "/");
        let dest = root.join(&rel);
        if let Some(p) = dest.parent() {
            fs::create_dir_all(p).map_err(|e| format!("Create dir: {}", e))?;
        }
        let mut out = fs::File::create(&dest).map_err(|e| format!("Create {}: {}", rel, e))?;
        std::io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
    }

    let index_obj = index.as_object().ok_or("index.json is not an object")?;
    let current: Value = read_workspace_json(&app, "tools.json").unwrap_or(Value::Object(serde_json::Map::new()));
    let mut current_obj = current.as_object().cloned().unwrap_or_default();
    for (k, v) in index_obj.iter() {
        current_obj.insert(k.clone(), v.clone());
    }
    write_workspace_json(&app, "tools.json", &Value::Object(current_obj))?;
    Ok(())
}

/// 导出单个定时任务为 .cron（zip：index.json 仅含 version + 该 job + 其 files）
#[tauri::command]
pub async fn workspace_export_cron(app: AppHandle, save_path: String, job_id: String) -> Result<(), String> {
    let root = workspace_root(&app)?;
    let cron: Value = read_workspace_json(&app, "cron.json")?;
    let jobs = cron.get("jobs").and_then(Value::as_array).ok_or("cron.json missing jobs")?;
    let job = jobs
        .iter()
        .find(|j| j.get("id").and_then(Value::as_str) == Some(&job_id))
        .ok_or_else(|| format!("Job '{}' not found", job_id))?;
    if job.get("system").and_then(Value::as_bool).unwrap_or(false) {
        return Err(format!("System job '{}' cannot be exported", job_id));
    }

    let mut files_to_add: Vec<String> = Vec::new();
    if let Some(arr) = job.get("files").and_then(Value::as_array) {
        for f in arr {
            if let Some(s) = f.as_str() {
                files_to_add.push(s.to_string());
            }
        }
    }

    let version = cron.get("version").cloned().unwrap_or(serde_json::json!(1));
    let index = serde_json::json!({ "version": version, "jobs": [job] });

    let out = fs::File::create(&save_path).map_err(|e| format!("Create file: {}", e))?;
    let mut zip = ZipWriter::new(out);
    let opts = FileOptions::default().unix_permissions(0o644);

    zip.start_file("index.json", opts).map_err(|e| e.to_string())?;
    zip.write_all(
        serde_json::to_string_pretty(&index).map_err(|e| e.to_string())?.as_bytes(),
    )
    .map_err(|e| e.to_string())?;

    for rel in &files_to_add {
        let full = root.join(rel);
        if full.exists() && full.is_file() {
            let content = fs::read(&full).map_err(|e| format!("Read {}: {}", rel, e))?;
            zip.start_file(rel, opts).map_err(|e| e.to_string())?;
            zip.write_all(&content).map_err(|e| e.to_string())?;
        }
    }

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

/// 导入 .cron：解压并合并 jobs 到 cron.json，写入附带 files
#[tauri::command]
pub async fn workspace_import_cron(app: AppHandle, zip_path: String) -> Result<(), String> {
    let root = workspace_root(&app)?;
    let file = fs::File::open(&zip_path).map_err(|e| format!("Open zip: {}", e))?;
    let mut zip = ZipArchive::new(file).map_err(|e| format!("Invalid zip: {}", e))?;

    let mut imported: Option<Value> = None;
    for i in 0..zip.len() {
        let mut entry = zip.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name().to_string();
        if name == "index.json" {
            let mut buf = String::new();
            entry.read_to_string(&mut buf).map_err(|e| e.to_string())?;
            imported = Some(serde_json::from_str(&buf).map_err(|e| format!("Parse index.json: {}", e))?);
            continue;
        }
        if entry.is_dir() {
            continue;
        }
        let rel = entry.name().replace('\\', "/");
        let dest = root.join(&rel);
        if let Some(p) = dest.parent() {
            fs::create_dir_all(p).map_err(|e| format!("Create dir: {}", e))?;
        }
        let mut out = fs::File::create(&dest).map_err(|e| format!("Create {}: {}", rel, e))?;
        std::io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
    }

    let imported = imported.ok_or("index.json not found in zip")?;
    let imported_jobs = imported.get("jobs").and_then(Value::as_array).ok_or("index.json missing jobs")?;
    let current = read_workspace_json(&app, "cron.json").unwrap_or(serde_json::json!({ "version": 1, "jobs": [] }));
    let mut current_jobs = current.get("jobs").and_then(Value::as_array).cloned().unwrap_or_default();
    let version = current.get("version").cloned().unwrap_or(serde_json::json!(1));

    for new_job in imported_jobs {
        let id = new_job.get("id").and_then(Value::as_str);
        if let Some(id) = id {
            if let Some(pos) = current_jobs.iter().position(|j| j.get("id").and_then(Value::as_str) == Some(id)) {
                current_jobs[pos] = new_job.clone();
            } else {
                current_jobs.push(new_job.clone());
            }
        } else {
            current_jobs.push(new_job.clone());
        }
    }

    let merged = serde_json::json!({ "version": version, "jobs": current_jobs });
    write_workspace_json(&app, "cron.json", &merged)?;
    Ok(())
}
