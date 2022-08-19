mod client;

use anyhow::Result;
use std::env;

#[tokio::main]
async fn main() -> Result<()> {
    logger::init().expect("Failed to init logger");
    let token = env::var("DISCORD_TOKEN").expect("DISCORD_TOKEN not set");
    client::run(token).await?;

    Ok(())
}
