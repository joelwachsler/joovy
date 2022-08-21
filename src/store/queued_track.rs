use anyhow::Result;

#[derive(Clone)]
pub struct QueuedTrack {
    title: String,
    url: String,
}

impl QueuedTrack {
    pub fn new(title: &str, url: &str) -> Self {
        Self {
            title: title.to_string(),
            url: url.to_string(),
        }
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub fn url(&self) -> &str {
        &self.url
    }

    pub async fn try_from_query(query: &str) -> Result<QueuedTrack> {
        let res = search::search(query).await?;
        Ok(QueuedTrack::new(res.title(), res.url()))
    }
}
