use anyhow::Result;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct SearchResult {
    fulltitle: String,
    webpage_url: String,
}

async fn search_raw(query: &str) -> Result<String> {
    let process = tokio::process::Command::new("youtube-dl")
        .arg(format!("ytsearch: {}", query))
        .arg("--skip-download")
        .arg("--print-json")
        .output()
        .await?;

    Ok(String::from_utf8(process.stdout)?)
}

async fn search(query: &str) -> Result<SearchResult> {
    let raw_res = search_raw(query).await?;
    let res = serde_json::from_str(&raw_res)?;
    Ok(res)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn it_works() {
        let res = search("chase pop").await;
        println!("Got res: {:?}", res);
    }
}
