use std::sync::Arc;

use anyhow::Result;
use typed_builder::TypedBuilder;

use crate::{
    command_context::CommandContext,
    store::{guild_store::GuildStore, guild_store_action::HasCtx},
};

impl GuildStore {
    pub async fn disconnect(&mut self, ctx: &CommandContext) -> Result<()> {
        ctx.songbird().await.remove(ctx.songbird_guild_id()).await?;
        ctx.send("Bye!").await?;

        Ok(())
    }
}

#[derive(TypedBuilder)]
pub struct Disconnect {
    ctx: Arc<CommandContext>,
}

impl HasCtx for Disconnect {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}
