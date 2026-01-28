// use std::net::{SocketAddr, TcpStream};
// use std::time::Duration;
use tauri::{Runtime, WebviewWindow};

pub fn show_window<R: Runtime>(window: &WebviewWindow<R>) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}

pub fn navigate<R: Runtime>(window: &WebviewWindow<R>, path: &str) {
    let _ = window.eval(&format!("window.location.href = '{}'", path));
}

// /// 检查指定端口是否被占用（通过尝试连接来判断）
// pub fn is_port_in_use(port: u16) -> bool {
//     // 尝试连接到端口，设置较短的超时时间（100ms）以快速检测
//     // 如果能连接成功，说明端口有服务在监听
//     let addr: SocketAddr = format!("127.0.0.1:{}", port).parse().unwrap_or_else(|_| {
//         // 如果解析失败，返回一个默认地址（虽然不太可能发生）
//         "127.0.0.1:0".parse().unwrap()
//     });

//     match TcpStream::connect_timeout(&addr, Duration::from_millis(100)) {
//         Ok(_) => true,   // 连接成功，端口被占用（有服务在监听）
//         Err(_) => false, // 连接失败或超时，端口未被占用
//     }
// }
