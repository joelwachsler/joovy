use anyhow::Result;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SearchResult {
    fulltitle: String,
    webpage_url: String,
    duration: u32,
}

impl SearchResult {
    pub fn title(&self) -> &str {
        &self.fulltitle
    }

    pub fn url(&self) -> &str {
        &self.webpage_url
    }

    pub fn duration(&self) -> u32 {
        self.duration
    }
}

async fn search_raw(query: &str) -> Result<String> {
    let query_arg = if query.starts_with("http") {
        query.to_string()
    } else {
        format!("ytsearch:{}", query)
    };

    let process = tokio::process::Command::new("youtube-dl")
        .arg(&query_arg)
        .arg("--skip-download")
        .arg("--print-json")
        .output()
        .await?;

    Ok(String::from_utf8(process.stdout)?)
}

pub async fn search(query: &str) -> Result<SearchResult> {
    let raw_res = search_raw(query).await?;
    let res = serde_json::from_str(&raw_res)?;
    Ok(res)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn query() {
        let res = search("chase pop").await.unwrap();
        assert_eq!(res.title(), "Neovaii - Chase Pop");
        assert_eq!(res.url(), "https://www.youtube.com/watch?v=ZnkRg-6zFfI");
        assert_eq!(res.duration(), 211);
    }

    #[tokio::test]
    async fn query_http() {
        let res = search("https://www.youtube.com/watch?v=ZnkRg-6zFfI")
            .await
            .unwrap();
        assert_eq!(res.title(), "Neovaii - Chase Pop");
        assert_eq!(res.url(), "https://www.youtube.com/watch?v=ZnkRg-6zFfI");
        assert_eq!(res.duration(), 211);
    }
}
