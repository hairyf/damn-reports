//! 工作区工具 / 定时任务导出与导入（.tool / .cron 为 zip 格式）

use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::Command;

use serde::Serialize;
use serde_json::{Map, Value};
use tauri::{AppHandle, Manager};
use zip::write::FileOptions;
use zip::{ZipArchive, ZipWriter};

/// 导入 .tool / .cron 的返回：导入的 id 列表 + 合并后的 dependencies（供前端触发安装与展示「安装中」）
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported_ids: Vec<String>,
    pub dependencies: HashMap<String, String>,
}

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

/// 从单个 item（tool 或 job）的 JSON 中提取 dependencies 为 HashMap
fn extract_dependencies(item: &Value) -> HashMap<String, String> {
    let mut out = HashMap::new();
    if let Some(obj) = item.get("dependencies").and_then(Value::as_object) {
        for (k, v) in obj {
            if let Some(s) = v.as_str() {
                out.insert(k.clone(), s.to_string());
            }
        }
    }
    out
}

/// 合并多组 dependencies，后者不覆盖前者（先出现的版本优先）
fn merge_dependencies(maps: &[HashMap<String, String>]) -> HashMap<String, String> {
    let mut out = HashMap::new();
    for m in maps {
        for (k, v) in m {
            out.entry(k.clone()).or_insert_with(|| v.clone());
        }
    }
    out
}

/// 导出单个工具配置为 .tool（zip：index.json 仅含该 tool_id + 其 files）
#[tauri::command]
pub async fn workspace_export_tools(app: AppHandle, save_path: String, tool_id: String) -> Result<(), String> {
    let root = workspace_root(&app)?;
    let tools_path = root.join("tool.json");
    let tools: Value = serde_json::from_str(
        &fs::read_to_string(&tools_path).map_err(|e| format!("Read tool.json: {}", e))?,
    )
    .map_err(|e| format!("Parse tool.json: {}", e))?;

    let obj = tools.as_object().ok_or("tool.json is not an object")?;
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

/// 解压 zip 并将 index.json 之外的文件写入工作区，返回解析后的 index.json 内容
fn unzip_and_get_index(root: &std::path::Path, zip_path: &str) -> Result<Value, String> {
    let file = fs::File::open(zip_path).map_err(|e| format!("Open zip: {}", e))?;
    let mut zip = ZipArchive::new(file).map_err(|e| format!("Invalid zip: {}", e))?;

    let mut index: Option<Value> = None;
    for i in 0..zip.len() {
        let mut entry = zip.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name().to_string();
        if name == "index.json" {
            let mut buf = String::new();
            entry.read_to_string(&mut buf).map_err(|e| e.to_string())?;
            index = Some(serde_json::from_str(&buf).map_err(|e| format!("Parse index.json: {}", e))?);
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
    index.ok_or_else(|| "index.json not found in zip".to_string())
}

/// 导入 .tool：解压并合并到 tool.json，写入附带 files；返回导入的 id 与合并的 dependencies
#[tauri::command]
pub async fn workspace_import_tools(app: AppHandle, zip_path: String) -> Result<ImportResult, String> {
    let root = workspace_root(&app)?;
    let index = unzip_and_get_index(&root, &zip_path)?;

    let index_obj = index.as_object().ok_or("index.json is not an object")?;
    let current: Value = read_workspace_json(&app, "tool.json").unwrap_or(Value::Object(serde_json::Map::new()));
    let mut current_obj = current.as_object().cloned().unwrap_or_default();
    let mut imported_ids = Vec::new();
    let mut deps_list = Vec::new();
    for (k, v) in index_obj.iter() {
        imported_ids.push(k.clone());
        deps_list.push(extract_dependencies(v));
        current_obj.insert(k.clone(), v.clone());
    }
    write_workspace_json(&app, "tool.json", &Value::Object(current_obj))?;
    Ok(ImportResult {
        imported_ids,
        dependencies: merge_dependencies(&deps_list),
    })
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

/// 导入 .cron：解压并合并 jobs 到 cron.json，写入附带 files；返回导入的 job id 与合并的 dependencies
#[tauri::command]
pub async fn workspace_import_cron(app: AppHandle, zip_path: String) -> Result<ImportResult, String> {
    let root = workspace_root(&app)?;
    let index = unzip_and_get_index(&root, &zip_path)?;

    let imported_jobs = index.get("jobs").and_then(Value::as_array).ok_or("index.json missing jobs")?;
    let current = read_workspace_json(&app, "cron.json").unwrap_or(serde_json::json!({ "version": 1, "jobs": [] }));
    let mut current_jobs = current.get("jobs").and_then(Value::as_array).cloned().unwrap_or_default();
    let version = current.get("version").cloned().unwrap_or(serde_json::json!(1));

    let mut imported_ids = Vec::new();
    let mut deps_list = Vec::new();
    for new_job in imported_jobs {
        let id = new_job.get("id").and_then(Value::as_str).map(String::from);
        if let Some(ref id) = id {
            imported_ids.push(id.clone());
        }
        deps_list.push(extract_dependencies(new_job));
        if let Some(id) = id {
            if let Some(pos) = current_jobs.iter().position(|j| j.get("id").and_then(Value::as_str) == Some(id.as_str())) {
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
    Ok(ImportResult {
        imported_ids,
        dependencies: merge_dependencies(&deps_list),
    })
}

/// 在工作区根目录合并 dependencies 到 package.json 并执行 pnpm install 或 npm install。
/// 无 node 时返回错误码 NO_NODE，安装失败时返回 INSTALL_FAILED: 详情。
/// Windows 上通过 cmd /c 调用，避免直接 Command::new("pnpm") 找不到可执行文件（program not found）。
#[tauri::command]
pub async fn workspace_install_dependencies(app: AppHandle, dependencies: HashMap<String, String>) -> Result<(), String> {
    if dependencies.is_empty() {
        return Ok(());
    }
    let root = workspace_root(&app)?;
    let package_path = root.join("package.json");

    let mut package: Value = if package_path.exists() {
        let s = fs::read_to_string(&package_path).map_err(|e| format!("Read package.json: {}", e))?;
        serde_json::from_str(&s).map_err(|e| format!("Parse package.json: {}", e))?
    } else {
        serde_json::json!({ "name": "workspace", "version": "0.0.0" })
    };

    let obj = package.as_object_mut().ok_or("package.json is not an object")?;
    if !obj.get("dependencies").and_then(Value::as_object).is_some() {
        obj.insert("dependencies".to_string(), Value::Object(Map::new()));
    }
    let deps_obj = obj.get_mut("dependencies").and_then(Value::as_object_mut).ok_or("package.json dependencies is not an object")?;
    for (k, v) in &dependencies {
        deps_obj.insert(k.clone(), Value::String(v.clone()));
    }

    let s = serde_json::to_string_pretty(&package).map_err(|e| e.to_string())?;
    fs::write(&package_path, s).map_err(|e| format!("Write package.json: {}", e))?;

    let has_node = run_check(&root, "node --version")?;
    if !has_node {
        return Err("NO_NODE: 未检测到 Node.js，请先安装 Node.js 后再导入".to_string());
    }

    let use_pnpm = run_check(&root, "pnpm -v")?;
    let install_cmd = if use_pnpm { "pnpm install" } else { "npm install" };
    run_install(&root, install_cmd)?;
    Ok(())
}

/// 通过 shell 执行命令（Windows 用 cmd /c，Unix 用 sh -c），避免 PATH 下 .cmd 等找不到。
fn run_shell_cmd(root: &std::path::Path, cmd: &str) -> Result<std::process::Output, String> {
    if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", cmd])
            .current_dir(root)
            .output()
            .map_err(|e| format!("执行 {} 失败: {}", cmd, e))
    } else {
        Command::new("sh")
            .args(["-c", cmd])
            .current_dir(root)
            .output()
            .map_err(|e| format!("执行 {} 失败: {}", cmd, e))
    }
}

fn run_check(root: &std::path::Path, cmd: &str) -> Result<bool, String> {
    let output = run_shell_cmd(root, cmd)?;
    Ok(output.status.success())
}

fn run_install(root: &std::path::Path, cmd: &str) -> Result<(), String> {
    let output = run_shell_cmd(root, cmd).map_err(|e| format!("INSTALL_FAILED: {}", e))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!(
            "INSTALL_FAILED: 依赖安装失败\n{}\n{}",
            stdout.trim(),
            stderr.trim()
        ));
    }
    Ok(())
}
