use std::sync::Arc;

use anyhow::Result;
use derive_builder::Builder;

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

#[derive(Builder, Default)]
#[builder(setter(into))]
pub struct Disconnect {
    ctx: Option<Arc<CommandContext>>,
}

impl HasCtx for Disconnect {
    fn ctx_base(&self) -> Option<Arc<CommandContext>> {
        self.ctx.clone()
    }
}
