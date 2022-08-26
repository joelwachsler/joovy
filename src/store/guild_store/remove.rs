use anyhow::Result;

use super::GuildStore;
use crate::command_context::CommandContext;

impl GuildStore {
    pub async fn remove(&mut self, ctx: &CommandContext, from: u64, to: Option<u64>) -> Result<()> {
        if let Some(to) = to {
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
