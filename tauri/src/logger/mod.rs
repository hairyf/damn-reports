use log::{Level, LevelFilter, Metadata, Record};
use std::io::Write;
use std::sync::atomic::{AtomicU8, Ordering};

/// 日志级别映射到数字
const TRACE: u8 = 0;
const DEBUG: u8 = 1;
const INFO: u8 = 2;
const WARN: u8 = 3;
const ERROR: u8 = 4;

static FILTER_LEVEL: AtomicU8 = AtomicU8::new(DEBUG);

/// 自定义日志格式化器
struct SimpleLogger;

impl log::Log for SimpleLogger {
    fn enabled(&self, metadata: &Metadata) -> bool {
        let current_level = FILTER_LEVEL.load(Ordering::Relaxed);
        let record_level = match metadata.level() {
            Level::Trace => TRACE,
            Level::Debug => DEBUG,
            Level::Info => INFO,
            Level::Warn => WARN,
            Level::Error => ERROR,
        };
        record_level >= current_level
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
            // 从模块路径中提取模块名
            let module_path = record.module_path().unwrap_or("unknown");
            
            // 格式化输出: [Module]: content
            let output = format!(
                "[{}]: {}\n",
                module_path,
                record.args()
            );
            
            // 输出到 stderr (错误级别) 或 stdout (其他级别)
            match record.level() {
                Level::Error => {
                    let mut stderr = std::io::stderr();
                    let _ = stderr.write_all(output.as_bytes());
                    let _ = stderr.flush();
                }
                _ => {
                    let mut stdout = std::io::stdout();
                    let _ = stdout.write_all(output.as_bytes());
                    let _ = stdout.flush();
                }
            }
        }
    }

    fn flush(&self) {
        let _ = std::io::stdout().flush();
        let _ = std::io::stderr().flush();
    }
}

static LOGGER: SimpleLogger = SimpleLogger;

/// 初始化日志系统
/// 
/// 默认日志级别为 Info，可以通过环境变量 RUST_LOG 控制
/// 例如: RUST_LOG=debug 或 RUST_LOG=services::workflow=debug
pub fn init() {
    // 从环境变量读取日志级别，默认为 info
    let log_level = std::env::var("RUST_LOG")
        .unwrap_or_else(|_| "info".to_string())
        .to_lowercase();
    
    let filter = match log_level.as_str() {
        "trace" => TRACE,
        "debug" => DEBUG,
        "info" => INFO,
        "warn" => WARN,
        "error" => ERROR,
        _ => INFO,
    };

    FILTER_LEVEL.store(filter, Ordering::Relaxed);

    log::set_logger(&LOGGER)
        .map(|()| log::set_max_level(LevelFilter::Trace))
        .expect("Failed to initialize logger");
}
