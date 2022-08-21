use anyhow::Result;
use serenity::utils::Color;
use std::sync::Arc;

use super::GuildStoresActionHandler;
use crate::command_context::CommandContext;

impl GuildStoresActionHandler {
    pub async fn print_queue(&mut self, ctx: Arc<CommandContext>) -> Result<()> {
        let store = self.get_or_create_store(&ctx).await?;
        let queue = store.queue();
        if queue.is_empty() {
            ctx.send("The queue is empty 👀").await?;
            return Ok(());
        }

        let current_track_index = store.current_track_index().unwrap_or_default();

        let output = queue.iter().enumerate().fold(vec![], |mut acc, (i, curr)| {
            let track_name = curr.name();
            if curr.should_skip() {
                acc.push(format!("`{i}` ~~{track_name}~~"));
            } else if i == current_track_index {
                acc.push("⬐ current track".into());
                acc.push(format!("`{i}` {track_name}"));
                acc.push("⬑ current track".into());
            } else {
                acc.push(format!("`{i}` {track_name}"));
            }
            acc
        });

        ctx.reply_embed(|embed| {
            embed
                .color(Color::from_rgb(255, 184, 31))
                .title("Queue")
                .description(output.join("\n"))
        })
        .await?;

        Ok(())
    }
}
