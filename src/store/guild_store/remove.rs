use std::sync::Arc;

use anyhow::Result;
use typed_builder::TypedBuilder;

use super::GuildStore;
use crate::{command_context::CommandContext, store::guild_store_action::HasCtx};

impl GuildStore {
    pub async fn remove(&mut self, args: Remove) -> Result<()> {
        let Remove { ctx, from, to } = args;

        if let Some(to) = args.to {
            if from > to {
                ctx.send(format!(
                    "To cannot be greater than from, (from: {from}, to: {to})"
                ))
                .await?;
                return Ok(());
            }
        }

        for i in from..to.unwrap_or(from + 1) {
            if let Some(track) = self.edit_track(i as usize) {
                track.skip_track();
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
