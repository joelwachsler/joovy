use std::collections::VecDeque;

use anyhow::Result;

use super::queued_track::QueuedTrack;
use crate::command_context::CommandContext;

/// The current state of a single guild.
pub struct GuildStore {
    current_track: Option<QueuedTrack>,
    queue: VecDeque<QueuedTrack>,
}

impl GuildStore {
    pub async fn new(ctx: &CommandContext) -> Result<Self> {
        ctx.join_voice().await?;

        Ok(Self {
            current_track: None,
            queue: VecDeque::new(),
        })
    }

    pub fn next_track_in_queue(&mut self) -> Option<QueuedTrack> {
        let next_item = self.queue.pop_front();
        self.current_track = next_item;
        self.current_track.clone()
    }

    pub async fn add_to_queue(&mut self, ctx: &CommandContext, query: &str) -> Result<()> {
        let new_track = QueuedTrack::try_from_query(ctx, query).await?;
        ctx.send(format!("{} has been added to the queue", new_track.name()))
            .await?;
        self.queue.push_back(new_track);

        Ok(())
    }

    pub fn remove_current_track(&mut self) {
        self.current_track = None;
    }

    pub fn is_playing(&self) -> bool {
        self.current_track.is_some()
    }
}
