use anyhow::Result;
use std::sync::Arc;

use super::GuildStoresActionHandler;
use crate::command_context::CommandContext;

impl GuildStoresActionHandler {
    pub async fn remove_last(&mut self, ctx: Arc<CommandContext>) -> Result<()> {
        let store = self.get_or_create_store(&ctx).await?;
        let track_to_skip = store.queue().len() - 1;
        self.remove(ctx, track_to_skip as u64, None).await?;

        Ok(())
    }
}
