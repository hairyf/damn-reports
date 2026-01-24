mod core;
mod extractor;
mod progress;
mod utils;
mod installable;

// 导出公共接口
pub use core::{download_file, ensure_extract};
pub use progress::{ProgressTracker};
pub use installable::{Installable, Nodejs, N8n};