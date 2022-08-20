use std::env;

use anyhow::Result;

use serenity::framework::standard::StandardFramework;
use serenity::prelude::*;
use songbird::SerenityInit;
use tracing::{info, instrument};

use crate::handler::Handler;

#[instrument]
pub async fn run() -> Result<()> {
    let token = env::var("DISCORD_TOKEN").expect("DISCORD_TOKEN not set");
    let intents = GatewayIntents::non_privileged() | GatewayIntents::MESSAGE_CONTENT;

    let mut client = Client::builder(token, intents)
        .event_handler(Handler)
        // not used by harder to hand pick features than to just register a framework
        .framework(StandardFramework::new())
        .register_songbird()
        .await
        .expect("Error creating client");

    tokio::spawn(async move {
        client
            .start()
            .await
            .map_err(|why| info!("Client ended: {:?}", why))
            .unwrap();
    });

    let _ = tokio::signal::ctrl_c().await;
    info!("Ctrl-C received, shutting down...");

    Ok(())
}
