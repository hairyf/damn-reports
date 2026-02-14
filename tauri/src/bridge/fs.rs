use std::cell::RefCell;
use std::fs;
use std::path::{Component, Path, PathBuf};

use grep_regex::RegexMatcherBuilder;
use grep_searcher::sinks::UTF8;
use grep_searcher::SearcherBuilder;
use ignore::overrides::OverrideBuilder;
use ignore::{WalkBuilder};
use serde::Serialize;
use tauri::{AppHandle, Manager};

/// 安全解析路径：禁止路径穿越
fn resolve_in_resource(app: &AppHandle, path: &str) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    
    // 规范化路径组件检查
    let path_check = Path::new(path);
    for component in path_check.components() {
        match component {
            Component::ParentDir => return Err("Path traversal (..) is not allowed".to_string()),
            Component::Normal(_) | Component::RootDir | Component::CurDir | Component::Prefix(_) => {}
        }
    }

    if path_check.is_absolute() {
        // 即使是绝对路径，通常也建议检查是否在允许的白名单目录内，
        // 但此处保留原逻辑：如果是绝对路径则直接使用（假设调用者知道自己在做什么）
        Ok(path_check.to_path_buf())
    } else {
        // 拼接到 workspace 目录
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
    let recursive = recursive.unwrap_or(false);
    
    // 如果不递归，使用标准 fs::read_dir 更轻量
    if !recursive {
        let mut entries = Vec::new();
        let rd = fs::read_dir(&full).map_err(|e| format!("Read dir failed: {}", e))?;
        for entry in rd {
            let entry = entry.map_err(|e| e.to_string())?;
            let ft = entry.file_type().map_err(|e| e.to_string())?;
            let name = entry.file_name().to_string_lossy().into_owned();
            
            entries.push(DirEntry {
                name,
                is_directory: ft.is_dir(),
                is_file: ft.is_file(),
                is_symlink: ft.is_symlink(),
            });
        }
        return Ok(entries);
    }

    // 递归模式：使用 WalkBuilder
    let mut entries = Vec::new();
    let prefix = full.clone();
    
    // max_depth(1) 等同于非递归，但这里我们只在 recursive=true 时进这里
    let walker = WalkBuilder::new(&full)
        .follow_links(false)
        .standard_filters(false) // 根据需求开启或关闭 gitignore 等
        .hidden(false)
        .build();

    for result in walker {
        match result {
            Ok(entry) => {
                // 跳过根目录自己
                if entry.path() == prefix { continue; }

                let ft = entry.file_type().unwrap(); // WalkDir entries 通常都有 file_type
                
                // 计算相对路径
                let rel_path = entry.path()
                    .strip_prefix(&prefix)
                    .unwrap_or(entry.path())
                    .to_string_lossy()
                    .replace('\\', "/"); // 统一使用 /

                entries.push(DirEntry {
                    name: rel_path,
                    is_directory: ft.is_dir(),
                    is_file: ft.is_file(),
                    is_symlink: ft.is_symlink(),
                });
            }
            Err(err) => eprintln!("Walk error: {}", err), // 也可以选择 return Err
        }
    }

    Ok(entries)
}

#[tauri::command]
pub async fn fs_remove(app: AppHandle, path: String) -> Result<(), String> {
    let full = resolve_in_resource(&app, &path)?;
    let metadata = fs::metadata(&full).map_err(|e| format!("Remove failed: {}", e))?;
    
    if metadata.is_dir() {
        fs::remove_dir_all(&full).map_err(|e| format!("Remove dir failed: {}", e))
    } else {
        // file 或 symlink
        fs::remove_file(&full).map_err(|e| format!("Remove file failed: {}", e))
    }
}

#[derive(serde::Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FsGrepOptions {
    #[serde(default)]
    pub literal: bool,
    #[serde(default)]
    pub ignore_case: bool,
    #[serde(default)]
    pub context: Option<u32>,
    #[serde(default)]
    pub limit: Option<u32>,
    #[serde(default)]
    pub glob: Option<String>,
}

const DEFAULT_LIMIT: u32 = 100;

#[tauri::command]
pub async fn fs_grep(
    app: AppHandle,
    path: String,
    pattern: String,
    options: Option<FsGrepOptions>,
) -> Result<String, String> {
    let full = resolve_in_resource(&app, &path.trim())?;
    let opts = options.unwrap_or_default();
    let limit = opts.limit.unwrap_or(DEFAULT_LIMIT);
    let context = opts.context.unwrap_or(0) as usize;

    // 1. 构建 Regex Matcher
    let matcher = RegexMatcherBuilder::new()
        .fixed_strings(opts.literal)
        .case_insensitive(opts.ignore_case)
        .build(&pattern)
        .map_err(|e| format!("Invalid regex: {}", e))?;

    // 2. 配置 WalkBuilder (包含 Glob 优化)
    let mut builder = WalkBuilder::new(&full);
    builder
        .follow_links(false)
        .standard_filters(true) // 建议开启，尊重 .gitignore
        .hidden(false);

    // 使用 override 处理 glob，这比自己遍历判断快得多，因为是在底层过滤
    if let Some(glob_pattern) = opts.glob {
        let mut override_builder = OverrideBuilder::new(&full);
        override_builder.add(&glob_pattern).map_err(|e| format!("Invalid glob: {}", e))?;
        let overrides = override_builder.build().map_err(|e| e.to_string())?;
        builder.overrides(overrides);
    }

    // 3. 并行/串行 搜索控制
    // 为了简单地收集结果并返回 String，这里使用 build_parallel() 的回调模式或者 build() 的迭代模式
    // 这里使用迭代模式配合 RefCell 简单实现“一旦达到限制即停止”
    
    let mut searcher = SearcherBuilder::new();
    searcher
        .line_number(true)
        .before_context(context)
        .after_context(context)
        .binary_detection(grep_searcher::BinaryDetection::quit(b'\x00'));

    let matches = RefCell::new(Vec::new());
    let match_count = RefCell::new(0u32);
    let limit_reached = RefCell::new(false);
    
    // 确定用于显示相对路径的基准目录
    let base_dir = if full.is_file() {
        full.parent().unwrap_or(&full).to_path_buf()
    } else {
        full.clone()
    };

    for result in builder.build() {
        if *match_count.borrow() >= limit {
            *limit_reached.borrow_mut() = true;
            break;
        }

        let entry = match result {
            Ok(e) => e,
            Err(_) => continue,
        };

        if !entry.file_type().map(|ft| ft.is_file()).unwrap_or(false) {
            continue;
        }

        let path = entry.path();
        
        // 执行搜索
        let _ = searcher.build().search_path(&matcher, path, UTF8(|line_no, line| {
            let mut count = match_count.borrow_mut();
            if *count >= limit {
                return Ok(false); // 停止当前文件的搜索
            }
            *count += 1;

            let rel_path = pathdiff::diff_paths(path, &base_dir)
                .unwrap_or_else(|| path.to_path_buf())
                .to_string_lossy()
                .replace('\\', "/");

            matches.borrow_mut().push(format!("{}:{}: {}", rel_path, line_no, line));
            Ok(true)
        }));
    }

    let mut result_str = matches.into_inner().join("\n");
    if *limit_reached.borrow() {
        result_str.push_str(&format!("\n\n[Limit of {} matches reached]", limit));
    }
    
    if result_str.is_empty() {
         Ok("No matches found.".to_string())
    } else {
         Ok(result_str)
    }
}