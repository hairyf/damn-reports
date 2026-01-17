use tauri::{path::BaseDirectory, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};
use std::fs;

pub fn migrate(app: &tauri::App) -> Result<(), tauri::Error> {
    let migrations = db_get_migrations(app);
    app.handle().plugin(
      tauri_plugin_sql::Builder::default()
          .add_migrations("sqlite:main.db", migrations)
          .build(),
  ).unwrap();
  Ok(())
}

fn db_get_migrations(app: &tauri::App) -> Vec<Migration> {
    let migration_sqls = db_get_prisma_migrations(app.handle());
    let migrations = migration_sqls
        .into_iter()
        .enumerate()
        .map(|(i, sql)| Migration {
            version: (i + 1) as i64,
            description: "migration",
            sql: Box::leak(sql.into_boxed_str()),
            kind: MigrationKind::Up,
        })
        .collect::<Vec<Migration>>();
    return migrations;
}

fn db_get_prisma_migrations(handle: &tauri::AppHandle) -> Vec<String> {
    // 1. 获取 migrations 根目录的绝对路径
    let migrations_root = handle
        .path()
        .resolve("prisma/migrations", BaseDirectory::Resource)
        .expect("failed to resolve migrations path");

    // 2. 读取目录下所有条目
    let mut entries = fs::read_dir(migrations_root)
        .expect("failed to read migrations directory")
        .filter_map(|res| res.ok())
        .map(|e| e.path())
        .filter(|p| p.is_dir()) // 只保留文件夹
        .collect::<Vec<_>>();

    // 3. 按文件夹名称排序（确保 20260115... 在 20260116... 之前）
    entries.sort();

    for entry in entries.iter() {
      println!("sqlite migration: {:?}", &clean_path(&entry));
    }

    entries
        .into_iter()
        .map(|dir| {
            let sql_path = dir.join("migration.sql");
            fs::read_to_string(&sql_path)
                .unwrap_or_else(|_| panic!("failed to read sql file at {:?}", sql_path))
        })
        .collect()
}

fn clean_path(path: &std::path::Path) -> String {
  let path_str = path.to_string_lossy();
  path_str.replace(r"\\?\", "").replace(r"\", "/")
}
