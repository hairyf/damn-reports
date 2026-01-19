use clokwerk::{Job, Scheduler, TimeUnits};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

use sea_orm::DatabaseConnection;
use std::time::Duration;
use std::{thread};
use tauri::{AppHandle, Manager, State};

mod utils;

use crate::task;

use utils::get_time_from_setting;

/// 用于控制调度器运行状态的结构体
pub struct SchedulerHandle {
    running: Arc<AtomicBool>,
}

pub fn start_schedule(app_handle: &AppHandle, db: DatabaseConnection) {
    // 初始化状态并注入 Tauri
    let running = Arc::new(AtomicBool::new(true));
    app_handle.manage(SchedulerHandle { running: running.clone() });

    scheduler_loop(app_handle.clone(), db, running);
}

pub async fn restart(
    app_handle: AppHandle,
    db: State<'_, DatabaseConnection>,
    handle: State<'_, SchedulerHandle>,
) -> Result<(), String> {
    println!("Update Schedule Status Request Received");

    // 1. 停止当前正在运行的调度循环
    handle.running.store(false, Ordering::SeqCst);
    
    // 给一点时间让旧线程退出（可选）
    thread::sleep(Duration::from_millis(500));

    // 2. 重新启动
    handle.running.store(true, Ordering::SeqCst);
    scheduler_loop(app_handle, db.inner().clone(), handle.running.clone());

    Ok(())
}

fn scheduler_loop(app_handle: AppHandle, db: DatabaseConnection, running: Arc<AtomicBool>) {
    thread::spawn(move || {
        let mut scheduler = Scheduler::new();
        
        let (collect_time, generate_time) = get_time_from_setting(&app_handle); 
        
        println!("Scheduler started for collect records time: {}", collect_time);
        println!("Scheduler started for generate report time: {}", generate_time);

        let collect_time_clone = collect_time.clone();
        scheduler.every(1.day()).at(&collect_time.as_str()).run(move || {
            println!("Collecting records of source at: {}", collect_time_clone);
            let db_clone = db.clone();
            tauri::async_runtime::spawn(async move {
                task::collect_records_of_source::trigger(db_clone).await.unwrap();
            });
        });

        let generate_time_clone = generate_time.clone();
        scheduler.every(1.day()).at(&generate_time.as_str()).run(move || {
            println!("Generating report at: {}", generate_time_clone);
            tauri::async_runtime::spawn(async move {
                if let Err(e) = task::call_n8n_workflow_webhook::trigger().await {
                    eprintln!("Failed to trigger n8n workflow webhook: {}", e);
                }
            });
        });

        // 调度循环
        while running.load(Ordering::SeqCst) {
            scheduler.run_pending();
            thread::sleep(Duration::from_millis(1000));
        }
        println!("Scheduler stopped.");
    });
}
