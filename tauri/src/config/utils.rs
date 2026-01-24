use std::path::PathBuf;

/// 递归搜索 node 二进制文件
pub fn search_node_binary(dir: &PathBuf, target: &str) -> Option<PathBuf> {
  use std::fs;

  if let Ok(entries) = fs::read_dir(dir) {
      for entry in entries.flatten() {
          let path = entry.path();
          if path.is_dir() {
              // 递归搜索子目录
              if let Some(found) = search_node_binary(&path, target) {
                  return Some(found);
              }
          } else if path.file_name().and_then(|n| n.to_str()) == Some("node")
              || path.file_name().and_then(|n| n.to_str()) == Some("node.exe")
          {
              // 找到 node 或 node.exe 文件
              return Some(path);
          }
      }
  }

  // 如果没找到，尝试拼接目标路径
  let candidate = dir.join(target);
  if candidate.exists() {
      return Some(candidate);
  }

  None
}