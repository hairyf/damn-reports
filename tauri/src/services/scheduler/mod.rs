use clokwerk::{Job, Scheduler, TimeUnits};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

use sea_orm::DatabaseConnection;
use std::time::Duration;
use tauri::{async_runtime::spawn, AppHandle, Manager, State};
pub mod task;
use crate::config::{store_dat_setting_collect_time, store_dat_setting_generate_time};

use tokio::time::{self};

/// 用于控制调度器运行状态的结构体
pub struct SchedulerHandle {
    running: Arc<AtomicBool>,
}

pub fn start(app_handle: &AppHandle, db: DatabaseConnection) {
    // 初始化状态并注入 Tauri
    let running = Arc::new(AtomicBool::new(true));
    app_handle.manage(SchedulerHandle {
        running: running.clone(),
    });
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        scheduler_permanent_loop(app_handle_clone.clone()).await;
    });
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        scheduler_loop(app_handle_clone.clone(), db, running).await;
    });
   
}

pub async fn restart(
    app_handle: AppHandle,
    db: State<'_, DatabaseConnection>,
    handle: State<'_, SchedulerHandle>,
) -> Result<(), String> {
    println!("Update Schedule Status Request Received");

    // 1. 停止当前正在运行的调度循环
    handle.running.store(false, Ordering::SeqCst);

    // 给足够的时间让旧循环退出（使用异步 sleep，等待至少 2 秒）
    tokio::time::sleep(Duration::from_millis(2000)).await;

    // 2. 重新启动（使用同一个 running 标志）
    handle.running.store(true, Ordering::SeqCst);
    let db_clone = db.inner().clone();
    let running_clone = handle.running.clone();
    tokio::spawn(async move { scheduler_loop(app_handle, db_clone, running_clone).await });

    Ok(())
}

async fn scheduler_loop(app_handle: AppHandle, db: DatabaseConnection, running: Arc<AtomicBool>) {
    let mut scheduler = Scheduler::new();
    let mut interval = time::interval(Duration::from_millis(100));

    let collect_time = store_dat_setting_collect_time(&app_handle);
    let generate_time = store_dat_setting_generate_time(&app_handle);

    println!(
        "Scheduler started for collect records time: {}",
        collect_time
    );
    println!(
        "Scheduler started for generate report time: {}",
        generate_time
    );

    scheduler
        .every(1.day())
        .at(&collect_time.as_str())
        .run(move || {
            let collect_time_clone = collect_time.clone();
            let db_clone = db.clone();
            println!("Collecting records of source at: {}", collect_time_clone);
            spawn(async move {
                task::collect_records_of_source::trigger(db_clone)
                    .await
                    .unwrap();
            });
        });

    scheduler
        .every(1.day())
        .at(&generate_time.as_str())
        .run(move || {
            let generate_time_clone = generate_time.clone();
            println!("Generating report at: {}", generate_time_clone);
            spawn(async move {
                task::call_n8n_workflow_webhook::trigger().await.unwrap();
            });
        });

    while running.load(Ordering::SeqCst) {
        scheduler.run_pending();
        interval.tick().await;
    }

    println!("Scheduler stopped.");
}

async fn scheduler_permanent_loop(app_handle: AppHandle) {
  let mut interval = time::interval(Duration::from_secs(1));

   
   loop {
     task::tick_check_n8n_process::trigger(app_handle.clone()).await.unwrap();
     interval.tick().await;
   }
}
