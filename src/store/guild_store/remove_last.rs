use anyhow::Result;

use super::GuildStore;
use crate::command_context::CommandContext;

impl GuildStore {
    pub async fn remove_last(&mut self, ctx: &CommandContext) -> Result<()> {
        let track_to_skip = self.queue().len() - 1;
        self.remove(ctx, track_to_skip as u64, None).await?;

        Ok(())
    }
}
