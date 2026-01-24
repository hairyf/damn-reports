use std::cell::RefCell;
use std::time::{Duration, Instant};
use tauri::{Runtime, WebviewWindow, Emitter};
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressPayload {
    pub title: String,
    pub percentage: f64,
    pub detail: String,
}

pub struct ProgressTracker<'a, R: Runtime> {
    window: &'a WebviewWindow<R>,
    total_phases: usize,
    current_phase: usize,
    current_title: String,
    last_emit_time: RefCell<Option<Instant>>,
}

impl<'a, R: Runtime> ProgressTracker<'a, R> {
    pub fn new(window: &'a WebviewWindow<R>, task_count: usize) -> Self {
        Self {
            window,
            total_phases: task_count,
            current_phase: 0,
            current_title: String::from("准备中..."),
            last_emit_time: RefCell::new(None),
        }
    }

    /// 切换阶段，并设置大标题
    pub fn start_phase(&mut self, title: &str) {
        self.current_title = title.to_string();
    }

    /// 完成一个阶段
    pub fn end_phase(&mut self) {
        if self.current_phase < self.total_phases {
            self.current_phase += 1;
        }
    }

    /// stage_pct: 当前子任务的进度 (0.0 - 100.0)
    /// detail: 持续替换的操作内容
    pub fn update(&self, stage_pct: f64, detail: String) {
        let now = Instant::now();
        let mut last_emit = self.last_emit_time.borrow_mut();
        
        // 节流处理：如果距离上次发送不足 150ms，则跳过
        if let Some(last_time) = *last_emit {
            if now.duration_since(last_time) < Duration::from_millis(150) {
                return;
            }
        }
        
        *last_emit = Some(now);
        
        let phase_weight = 100.0 / self.total_phases as f64;
        let global_pct = (self.current_phase as f64 * phase_weight) + (stage_pct * phase_weight / 100.0);

        let _ = self.window.emit("install-progress", ProgressPayload {
            title: self.current_title.clone(),
            percentage: global_pct,
            detail,
        });
    }

    /// 跳过指定数量的阶段
    pub fn skip_phases(&mut self, count: usize) {
        self.current_phase = (self.current_phase + count).min(self.total_phases);
    }
}