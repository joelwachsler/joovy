use serenity::framework::standard::macros::command;
use serenity::framework::standard::CommandResult;
use serenity::model::channel::Message;
use serenity::prelude::*;

use crate::has_songbird::HasSongbird;
use crate::reply_and_log::ReplyAndLog;

#[command]
#[only_in(guilds)]
pub async fn disconnect(ctx: &Context, msg: &Message) -> CommandResult {
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
