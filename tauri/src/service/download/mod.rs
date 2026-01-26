mod core;
mod extractor;
mod installable;
mod progress;
mod utils;

// 导出公共接口
pub use core::{download_file, ensure_extract};
pub use installable::{Installable, N8n, Nodejs};
pub use progress::ProgressTracker;
