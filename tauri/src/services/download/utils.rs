use std::fs;
use std::path::{Path, PathBuf};

// 引入 Unix 专属权限库
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

/// 递归为目录下的所有文件赋予可执行权限 (仅 Unix)
#[cfg(unix)]
pub fn fix_recursive_permissions(path: &Path) -> std::io::Result<()> {
    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            fix_recursive_permissions(&entry.path())?;
        }
    } else {
        let mut perms = fs::metadata(path)?.permissions();
        perms.set_mode(0o755); // rwxr-xr-x
        fs::set_permissions(path, perms)?;
    }
    Ok(())
}

pub fn flatten_directory(dest: &PathBuf) -> Result<(), String> {
    let entries: Vec<_> = fs::read_dir(dest).map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();

    let dir_entries: Vec<_> = entries.iter()
        .filter(|e| {
            let path = e.path();
            let is_dir = path.is_dir();
            let file_name = path.file_name().and_then(|n| n.to_str());
            let is_hidden = file_name.map(|n| n.starts_with('.')).unwrap_or(false);
            is_dir && !is_hidden
        })
        .collect();

    if dir_entries.len() == 1 {
        let sub_dir = dir_entries[0].path();
        let sub_entries = fs::read_dir(&sub_dir).map_err(|e| e.to_string())?;
        
        for entry in sub_entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let from = entry.path();
            let to = dest.join(from.file_name().unwrap());
            fs::rename(from, to).map_err(|e| e.to_string())?;
        }
        fs::remove_dir(sub_dir).ok();
    }
    Ok(())
}
