use std::io::Cursor;
use std::path::PathBuf;

pub fn extract_zip(buffer: &[u8], dest: &PathBuf) -> Result<(), String> {
    let mut archive = zip::ZipArchive::new(Cursor::new(buffer))
        .map_err(|e| format!("Zip格式非法: {}", e))?;
    archive.extract(dest).map_err(|e| format!("Zip解压失败: {}", e))
}

pub fn extract_tgz(buffer: &[u8], dest: &PathBuf) -> Result<(), String> {
    use flate2::read::GzDecoder;
    use tar::Archive;
    let tar_gz = GzDecoder::new(Cursor::new(buffer));
    let mut archive = Archive::new(tar_gz);
    archive.unpack(dest).map_err(|e| format!("Tar.gz解压失败: {}", e))
}
