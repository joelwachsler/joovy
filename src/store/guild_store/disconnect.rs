use anyhow::Result;

use crate::{command_context::CommandContext, store::guild_store::GuildStore};

impl GuildStore {
    pub async fn disconnect(&mut self, ctx: &CommandContext) -> Result<()> {
        ctx.songbird().await.remove(ctx.songbird_guild_id()).await?;
        ctx.send("Bye!").await?;

        Ok(())
    }
}
