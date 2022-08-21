use anyhow::Result;
use std::sync::Arc;

use super::GuildStoresActionHandler;
use crate::command_context::CommandContext;

impl GuildStoresActionHandler {
    pub async fn remove_current_track(&mut self, ctx: Arc<CommandContext>) -> Result<()> {
        let store = self.get_or_create_store(&ctx).await?;
        store.remove_current_track();

        Ok(())
    }
}
