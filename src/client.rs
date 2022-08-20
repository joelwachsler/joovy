use std::env;

use anyhow::Result;

use serenity::framework::standard::StandardFramework;
use serenity::prelude::*;
use songbird::SerenityInit;
use tracing::{info, instrument};

use crate::command_handler::CommandHandler;

#[instrument]
pub async fn run() -> Result<()> {
    let token = env::var("DISCORD_TOKEN").expect("DISCORD_TOKEN not set");
    let intents = GatewayIntents::non_privileged() | GatewayIntents::MESSAGE_CONTENT;

    let mut client = Client::builder(token, intents)
        .event_handler(CommandHandler)
        // not used by harder to hand pick features than to just register a framework
        .framework(StandardFramework::new())
        .register_songbird()
        .await
        .expect("Error creating client");

    let shard_manager = client.shard_manager.clone();

    tokio::spawn(async move {
        tokio::signal::ctrl_c()
            .await
            .expect("Could not register ctrl+c handler");
        shard_manager.lock().await.shutdown_all().await;
    });

    let _ = client
        .start()
        .await
        .map_err(|why| info!("Client error: {:?}", why));

    Ok(())
}
