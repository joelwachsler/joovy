use anyhow::Result;
use std::sync::Arc;

use super::{GuildStoreAction, GuildStoresActionHandler};
use crate::command_context::CommandContext;

impl GuildStoresActionHandler {
    pub async fn add_to_queue(&mut self, ctx: Arc<CommandContext>, query: &str) -> Result<()> {
        let store = self.get_or_create_store(&ctx).await?;
        let _ = store.add_to_queue(&ctx, query).await?;

        if !store.is_playing() {
            ctx.send_action(GuildStoreAction::PlayNextTrack(ctx.clone()))
                .await?;
        }

        Ok(())
    }
}
