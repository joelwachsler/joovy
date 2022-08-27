use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use typed_builder::TypedBuilder;

use super::{remove::Remove, GuildStore};
use crate::{
    command_context::CommandContext,
    store::guild_action::{Execute, HasCtx},
};

#[async_trait]
impl Execute for RemoveLast {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        let RemoveLast { ctx } = self;

        let track_to_skip = store.queue().len() - 1;
        Remove::builder()
            .ctx(ctx.clone())
            .from(track_to_skip as u64)
            .build()
            .execute(store)
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
