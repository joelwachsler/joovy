use anyhow::Result;
use serenity::async_trait;

use super::{
    guild_store::{Store, TrackQueryResult},
    queued_track::QueuedTrack,
};

#[derive(Default)]
pub struct MemoryStore {
    queue: Vec<QueuedTrack>,
}

#[async_trait]
impl Store for MemoryStore {
    async fn queue(&self) -> Result<Vec<QueuedTrack>> {
        Ok(self.queue.clone())
    }

    async fn add_track_to_queue(&mut self, track: &QueuedTrack) -> Result<()> {
        self.queue.push(track.clone());
        Ok(())
    }

    async fn skip_track(&mut self, index: i32) -> Result<()> {
        let _ = self
            .queue
            .get_mut(index as usize)
            .map(|track| track.skip_track());

        Ok(())
    }

    async fn find_track_query_result(&self, _query: &str) -> Result<Option<TrackQueryResult>> {
        Ok(None)
    }

    async fn add_track_query_result(&self, _query: &str, _track: &QueuedTrack) -> Result<()> {
        Ok(())
    }
}
