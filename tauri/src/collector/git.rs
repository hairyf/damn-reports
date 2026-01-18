use serde::{Deserialize, Serialize};
use std::path::Path;
use git2::{Repository, BranchType, DiffOptions, DiffFormat};
use chrono::{FixedOffset, NaiveTime, TimeZone};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileDiff {
    pub path: String,
    pub status: String, // "Added", "Deleted", "Modified", etc.
    pub additions: usize,
    pub deletions: usize,
    pub patch: String,  // 具体的代码变化，AI 分析的核心
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitCommit {
    pub id: String,
    pub message: String,
    pub author: String,
    pub date: i64,
    pub files: Vec<FileDiff>,
    pub total_insertions: i32,
    pub total_deletions: i32,
}

#[derive(Debug, Serialize)]
pub struct CollectGitResult {
    pub data: Vec<GitCommit>,
    pub count: usize,
}

pub async fn daily(
    repository: String,
    branch: String,
    author: String,
) -> Result<CollectGitResult, String> {
    let repo = Repository::open(&repository).map_err(|e| e.to_string())?;
    
    // 1. 定位分支
    let branch_obj = repo.find_branch(&branch, BranchType::Local).map_err(|e| e.to_string())?;
    let target_oid = branch_obj.get().target().ok_or("Invalid branch target")?;

    // 2. 时间计算 (北京时间今日 12:00 起)
    let beijing_tz = FixedOffset::east_opt(8 * 3600).unwrap();
    let now = chrono::Utc::now().with_timezone(&beijing_tz);
    let start_ts = beijing_tz.from_local_datetime(
        &now.date_naive().and_time(NaiveTime::from_hms_opt(12, 0, 0).unwrap())
    ).single().unwrap().timestamp();

    // 3. 配置 Revwalk
    let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
    revwalk.push(target_oid).map_err(|e| e.to_string())?;
    revwalk.set_sorting(git2::Sort::TIME).map_err(|e| e.to_string())?;

    let mut commits = Vec::new();

    for oid_result in revwalk {
        let oid = oid_result.map_err(|e| e.to_string())?;
        let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
        let commit_time = commit.time().seconds();

        if commit_time < start_ts { break; }
        if !commit.author().name().unwrap_or("").contains(&author) { continue; }

        // 4. 获取详细的 Diff 信息
        let tree = commit.tree().map_err(|e| e.to_string())?;
        let parent_tree = commit.parent(0).and_then(|p| p.tree()).ok();
        
        let mut diff_opts = DiffOptions::new();
        // 如果文件很大，可以增加上下文行数限制，防止 patch 过长
        diff_opts.context_lines(3); 

        let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), Some(&mut diff_opts))
            .map_err(|e| e.to_string())?;

        let mut file_diffs: Vec<FileDiff> = Vec::new();
        
        // 遍历 diff 获取每个文件的详细信息和 Patch
        diff.print(DiffFormat::Patch, |delta, _hunk, line| {
            let path = delta.new_file().path().unwrap_or(Path::new("")).to_string_lossy().into_owned();
            
            // 查找或创建该文件的 FileDiff
            if let Some(file_diff) = file_diffs.iter_mut().find(|f| f.path == path) {
                // 将 line 内容追加到该文件的 patch 中
                let content = std::str::from_utf8(line.content()).unwrap_or("");
                file_diff.patch.push(line.origin()); // +, -, ' ' 等前缀
                file_diff.patch.push_str(content);
            } else {
                file_diffs.push(FileDiff {
                    path: path.clone(),
                    status: format!("{:?}", delta.status()),
                    additions: 0, // 如果需要精确到文件的行列，可以用 stats，这里先简化
                    deletions: 0,
                    patch: String::new(),
                });
            }
            true
        }).map_err(|e| e.to_string())?;

        let stats = diff.stats().map_err(|e| e.to_string())?;

        commits.push(GitCommit {
            id: oid.to_string() [..7].to_string(), // 取前7位短 ID
            message: commit.summary().unwrap_or("").to_string(),
            author: author.clone(),
            date: commit_time,
            files: file_diffs,
            total_insertions: stats.insertions() as i32,
            total_deletions: stats.deletions() as i32,
        });
    }

    Ok(CollectGitResult { count: commits.len(), data: commits })
}