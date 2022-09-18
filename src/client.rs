use std::env;

use anyhow::Result;

use sea_orm::DatabaseConnection;
use serenity::framework::standard::StandardFramework;
use serenity::prelude::*;
use songbird::SerenityInit;
use tracing::{info, instrument};

use crate::{commands::CommandHandler, store::guild_stores::GuildStores};

#[instrument]
pub async fn run(conn: DatabaseConnection) -> Result<()> {
    let token = env::var("DISCORD_TOKEN").expect("Missing DISCORD_TOKEN in env");
    let intents = GatewayIntents::non_privileged() | GatewayIntents::MESSAGE_CONTENT;

    let mut client = Client::builder(token, intents)
        .event_handler(CommandHandler)
        // Even though the framework functionality is not used (we don't use it because it does
        // not support slash commands) a lot of needed serenity features are automatically
        // registered which are hard to register by hand.
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

    {
        let mut data = client.data.write().await;
        data.insert::<GuildStores>(GuildStores::init_store(conn));
    }

    let _ = client
        .start()
        .await
        .map_err(|why| info!("Client error: {:?}", why));

    Ok(())
}
