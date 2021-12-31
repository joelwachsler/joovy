use std::env;

use tokio::{fs::File, io::AsyncWriteExt};

const BASE_SEARCH_URL: &str = "https://www.youtube.com/results?";
// const BASE: &str = "https://www.youtube.com/youtubei/v1/search?key=";

#[tokio::main]
async fn main() -> Result<(), String> {
    dotenv::dotenv().ok();

    let args = match env::var("TESTING") {
        Ok(res) => res,
        Err(error) => return Err(format!("Failed to read env variable: {}", error)),
    };

    let query = String::from("chase pop");

    let content = match get_content(query).await {
        Ok(res) => res,
        Err(error) => return Err(format!("Failed to get content: {:?}", error)),
    };

    return match write_to_file(&content).await {
        Ok(_) => Ok(()),
        Err(error) => Err(format!("Failed to write content: {:?}", error)),
    }
}

async fn write_to_file(str: &String) -> Result<(), std::io::Error> {
    File::create("./index.html")
        .await?
        .write_all(str.as_bytes())
        .await
}

async fn get_content(query: String) -> reqwest::Result<String> {
    reqwest::get(format!("{}{}", BASE_SEARCH_URL, query))
        .await?
        .text()
        .await
}
