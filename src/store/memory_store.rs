use anyhow::Result;
use serenity::async_trait;

use super::{
    guild_store::{CurrentTrack, Store},
    queued_track::QueuedTrack,
};

pub struct MemoryStore {
    current_track: CurrentTrack,
    queue: Vec<QueuedTrack>,
}

impl Default for MemoryStore {
    fn default() -> Self {
        Self {
            current_track: CurrentTrack::None,
            queue: vec![],
        }
    }
}

#[async_trait]
impl Store for MemoryStore {
    async fn current_track(&self) -> Result<CurrentTrack> {
        Ok(self.current_track)
    }

    async fn set_current_track(&mut self, track: &CurrentTrack) -> Result<()> {
        self.current_track = *track;
        Ok(())
    }

    async fn queue(&self) -> Result<Vec<QueuedTrack>> {
        Ok(self.queue.clone())
    }

    async fn add_track_to_queue(&mut self, track: &QueuedTrack) -> Result<()> {
        self.queue.push(track.clone());
        Ok(())
    }

    async fn edit_track(&mut self, index: usize, track: &QueuedTrack) -> Result<()> {
        self.queue[index] = track.clone();
        Ok(())
    }
}
