use anyhow::Result;
use std::sync::Arc;

use super::GuildStoresActionHandler;
use crate::command_context::CommandContext;

impl GuildStoresActionHandler {
    pub async fn disconnect(&mut self, ctx: Arc<CommandContext>) -> Result<()> {
        ctx.songbird().await.remove(ctx.songbird_guild_id()).await?;
        ctx.send("Bye!").await?;
        self.remove_store(&ctx).await;

        Ok(())
    }
}
