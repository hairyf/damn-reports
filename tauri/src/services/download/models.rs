#[derive(Clone, serde::Serialize)]
pub struct Progress {
    pub progress: f64,
    pub r#type: String,
}

#[derive(Clone, serde::Serialize)]
pub struct ExtractionStart {
    pub r#type: String,
}
