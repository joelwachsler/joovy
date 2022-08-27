use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use typed_builder::TypedBuilder;

use super::{remove::Remove, GuildStore};
use crate::{
    command_context::CommandContext,
    store::guild_store_action::{Execute, HasCtx},
};

impl GuildStore {
    pub async fn remove_last(&mut self, args: &RemoveLast) -> Result<()> {
        let RemoveLast { ctx } = args;

        let track_to_skip = self.queue().len() - 1;
        self.remove(
            &Remove::builder()
                .ctx(ctx.clone())
                .from(track_to_skip as u64)
                .build(),
        )
        .await?;

        Ok(())
    }
}

#[derive(TypedBuilder)]
pub struct RemoveLast {
    ctx: Arc<CommandContext>,
}

impl HasCtx for RemoveLast {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}

#[async_trait]
impl Execute for RemoveLast {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        store.remove_last(self).await
    }
}
