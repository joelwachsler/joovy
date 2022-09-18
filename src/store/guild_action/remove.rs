use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use typed_builder::TypedBuilder;

use super::GuildStore;
use crate::{
    command_context::CommandContext,
    store::guild_action::{Execute, HasCtx},
};

#[async_trait]
impl Execute for Remove {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        let Remove { ctx, from, to } = self;

        if let Some(to) = to {
            if from > to {
                ctx.send(format!(
                    "To should not be greater than from, (from: {from}, to: {to})"
                ))
                .await?;
                return Ok(());
            }
        }

        let queue = store.queue().await?;

        for i in (*from)..to.unwrap_or(from + 1) {
            if let Some(track) = queue.get(i as usize) {
                store.skip_track(i as i32).await?;
                ctx.send(format!("{} has been removed from the queue.", track.name()))
                    .await?;
            }
        }

        Ok(())
    }
}

#[derive(TypedBuilder)]
pub struct Remove {
    ctx: Arc<CommandContext>,
    pub from: u64,
    #[builder(default)]
    pub to: Option<u64>,
}

impl HasCtx for Remove {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}
