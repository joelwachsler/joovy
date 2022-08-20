mod client;
mod command_context;
mod command_handler;
mod commands;

use anyhow::Result;
use tracing::instrument;

#[tokio::main]
#[instrument]
async fn main() -> Result<()> {
    logger::init().expect("Failed to init logger");
    client::run().await?;

    Ok(())
}