use std::fmt::Display;
use std::sync::Arc;

use anyhow::Result;

use logger::info;
use serenity::async_trait;
use serenity::framework::standard::macros::{command, group};
use serenity::framework::standard::{Args, CommandResult, StandardFramework};
use serenity::http::CacheHttp;
use serenity::model::channel::Message;
use serenity::model::prelude::Ready;
use serenity::prelude::*;
use songbird::{SerenityInit, Songbird};

#[group]
#[commands(play, disconnect)]
struct General;

struct Handler;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, _: Context, ready: Ready) {
        info!("{} is connected!", ready.user.name);
    }
}

#[command]
#[only_in(guilds)]
async fn play(ctx: &Context, msg: &Message, mut args: Args) -> CommandResult {
    join(ctx, msg).await?;

    let url = match args.single::<String>() {
        Ok(url) => url,
        Err(_) => {
            msg.reply_log(ctx, "Please provide a valid URL").await?;
            return Ok(());
        }
    };

    if !url.starts_with("http") {
        msg.reply_log(ctx, "Invalid url").await?;
        return Ok(());
    }

    let guild = msg.guild(ctx).unwrap();
    let guild_id = guild.id;

    let manager = songbird::get(ctx).await.unwrap().clone();

    if let Some(handler_lock) = manager.get(guild_id) {
        let mut handler = handler_lock.lock().await;

        msg.reply_log(ctx, format!("Trying to start: {}", url))
            .await?;
        let source = match songbird::ytdl(&url).await {
            Ok(source) => source,
            Err(e) => {
                msg.reply_log(ctx, format!("Error starting source: {}", e))
                    .await?;
                return Ok(());
            }
        };

        handler.play_source(source);
        msg.reply_log(ctx, format!("Now playing {}", url)).await?;
    }

    Ok(())
}

#[async_trait]
trait HasSongbird {
    async fn songbird(&self) -> Arc<Songbird>;
}

#[async_trait]
impl HasSongbird for Context {
    async fn songbird(&self) -> Arc<Songbird> {
        songbird::get(self)
            .await
            .expect("Songbird Voice client failed")
    }
}

#[async_trait]
trait ReplyAndLog {
    /// Replies and logs the message.
    async fn reply_log<T>(&self, cache: impl CacheHttp, msg: T) -> Result<()>
    where
        T: Display + Send + Sync;
}

#[async_trait]
impl ReplyAndLog for Message {
    async fn reply_log<T>(&self, cache: impl CacheHttp, msg: T) -> Result<()>
    where
        T: Display + Send + Sync,
    {
        info!("{}", msg);
        self.reply(cache, msg).await?;
        Ok(())
    }
}

async fn join(ctx: &Context, msg: &Message) -> CommandResult {
    let guild = msg.guild(&ctx.cache).unwrap();
    let guild_id = guild.id;

    let channel_id = guild
        .voice_states
        .get(&msg.author.id)
        .and_then(|voice_state| voice_state.channel_id);

    let connect_to = match channel_id {
        Some(channel) => channel,
        None => {
            msg.reply_log(ctx, "Not in a voice channel").await?;
            return Ok(());
        }
    };

    let manager = ctx.songbird().await;
    let _ = manager.join(guild_id, connect_to).await;

    Ok(())
}

#[command]
#[only_in(guilds)]
async fn disconnect(ctx: &Context, msg: &Message) -> CommandResult {
    let guild = msg.guild(&ctx.cache).unwrap();
    let guild_id = guild.id;

    let manager = ctx.songbird().await;

    if manager.get(guild_id).is_some() {
        if let Err(e) = manager.remove(guild_id).await {
            msg.reply_log(ctx, format!("Failed to disconnect: {}", e))
                .await?;
        }
    } else {
        msg.reply_log(ctx, "Not in a voice channel").await?;
        return Ok(());
    }

    Ok(())
}

pub async fn run(token: String) -> Result<()> {
    let framework = StandardFramework::new()
        .configure(|c| c.prefix("/"))
        .group(&GENERAL_GROUP);

    let intents = GatewayIntents::non_privileged() | GatewayIntents::MESSAGE_CONTENT;

    let mut client = Client::builder(token, intents)
        .event_handler(Handler)
        .framework(framework)
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
