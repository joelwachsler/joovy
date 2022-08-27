use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use typed_builder::TypedBuilder;

use crate::{
    command_context::CommandContext,
    store::{
        guild_store::GuildStore,
        guild_store_action::{Execute, HasCtx},
    },
};

impl GuildStore {
    pub async fn disconnect(&mut self, args: &Disconnect) -> Result<()> {
        let Disconnect { ctx } = args;

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

#[async_trait]
impl Execute for Disconnect {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        store.disconnect(self).await
    }
}
