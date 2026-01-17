use clokwerk::{Job, Scheduler, TimeUnits};
use super::service;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt; // 注意: v1 使用 Window, v2 使用 Emitter

// --- 状态管理结构体 ---

// 用于在 Tauri 状态中保存当前任务的控制器
pub struct SchedulerState {
    // 这是一个标志位，当设置为 false 时，后台线程会跳出循环并结束
    running_flag: Arc<AtomicBool>,
}

impl SchedulerState {
    // 停止当前任务
    fn stop(&self) {
        self.running_flag.store(false, Ordering::Relaxed);
    }
}

// --- 辅助函数 ---

// 修改为接收 AppHandle，这样在 start 和 command 中都能复用
fn get_times_from_setting(app_handle: &AppHandle) -> (String, String) {
    // 注意：这里假设你已经正确配置了 store 插件
    // 在 Tauri v2 中 store api 有所变化，这里按通用逻辑处理
    let store = app_handle
        .store(".store.dat")
        .expect("Failed to load store");
    let setting = store.get("setting");

    let collect_time = setting
        .as_ref()
        .and_then(|s| s.get("collectTime"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| "05:45".to_string());

    let generate_time = setting
        .as_ref()
        .and_then(|s| s.get("generateTime"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| "05:50".to_string());

    (collect_time, generate_time)
}

// 核心逻辑：启动调度器线程
fn spawn_scheduler_thread(app_handle: AppHandle) -> Arc<AtomicBool> {
    let (collect_time, generate_time) = get_times_from_setting(&app_handle);
    let running_flag = Arc::new(AtomicBool::new(true));
    let thread_flag = running_flag.clone();

    thread::spawn(move || {
        let mut scheduler = Scheduler::new();

        println!(
            "Schedule Thread Start: Collect at {}, Generate at {}",
            collect_time, generate_time
        );

        // 任务 1: Collect
        scheduler.every(1.day()).at(&collect_time).run(move || {
            service::collect_records_of_source::trigger();
        });

        scheduler.every(1.day()).at(&generate_time).run(move || {
            service::call_n8n_workflow_webhook::trigger();
        });

        // 循环检查
        loop {
            // 1. 检查是否收到停止信号
            if !thread_flag.load(Ordering::Relaxed) {
                println!("Stop Old Schedule Thread");
                break;
            }

            // 2. 执行挂起的任务
            scheduler.run_pending();

            // 3. 休眠一小段时间，避免占用 CPU
            thread::sleep(Duration::from_millis(500));
        }
    });

    running_flag
}

// --- Tauri Command & Start ---
#[tauri::command]
pub fn update_schedule_status(
    app_handle: AppHandle,
    state: tauri::State<'_, Mutex<SchedulerState>>,
) {
    println!("Update Schedule Status Request Received");

    // 1. 获取状态锁
    let mut scheduler_state = state.lock().unwrap();

    // 2. 停止当前的定时任务 (将旧线程的 flag 设为 false)
    scheduler_state.stop();

    // 3. 启动新的定时任务线程，并更新 State 中的 flag
    let new_flag = spawn_scheduler_thread(app_handle);
    scheduler_state.running_flag = new_flag;
}

pub fn start(app: &tauri::App) {
    let app_handle = app.handle().clone();

    // 1. 启动 clokwerk 定时任务
    let running_flag = spawn_scheduler_thread(app_handle);

    // 2. 将控制句柄保存到 Tauri 的全局状态管理中
    // 我们用 Mutex 包裹，因为 Command 可能会并发访问（虽然这里不太可能，但这是 Rust 规范）
    app.manage(Mutex::new(SchedulerState { running_flag }));
}
