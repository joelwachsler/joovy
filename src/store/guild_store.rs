use anyhow::Result;
use serenity::{async_trait, prelude::*};
use std::sync::Arc;

use super::{guild_stores::GuildStores, queued_track::QueuedTrack};
use crate::command_context::CommandContext;

/// The current state of a single guild.
pub struct GuildStore {
    state: RwLock<GuildStoreState>,
}

impl GuildStore {
    pub fn new() -> Self {
        Self {
            state: RwLock::new(GuildStoreState::new()),
        }
    }

    pub async fn next_track_in_queue(&self) -> Option<QueuedTrack> {
        let mut state = self.state.write().await;
        let next_item = state.queue.pop();
        state.current_track = next_item;
        state.current_track.clone()
    }

    pub async fn add_to_queue(&self, ctx: &CommandContext, query: &str) -> Result<()> {
        let mut state = self.state.write().await;
        let new_track = QueuedTrack::try_from_query(query).await?;
        // should probably not write this while the store is locked
        ctx.send(format!("{} has been added to the queue", new_track.title()))
            .await?;
        state.queue.push(new_track);

        Ok(())
    }

    pub async fn is_playing(&self) -> bool {
        let state = self.state.read().await;
        state.current_track.is_some()
    }
}

#[async_trait]
pub trait HasGuildStore {
    async fn guild_store(&self) -> Arc<GuildStore>;
}

#[async_trait]
impl HasGuildStore for CommandContext {
    async fn guild_store(&self) -> Arc<GuildStore> {
        let data_read = self.ctx().data.read().await;
        let guild_stores = data_read.get::<GuildStores>().unwrap().clone();
        let channel_id = self.text_channel_id().await;
        guild_stores.get_or_create_store(channel_id.0).await
    }
}

struct GuildStoreState {
    current_track: Option<QueuedTrack>,
    queue: Vec<QueuedTrack>,
}

impl GuildStoreState {
    fn new() -> Self {
        Self {
            current_track: None,
            queue: vec![],
        }
    }
}
