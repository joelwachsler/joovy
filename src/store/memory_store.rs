use anyhow::Result;
use serenity::async_trait;

use super::{
    guild_store::{CurrentTrack, Playlist, Store, TrackQueryResult},
    queued_track::QueuedTrack,
};

pub struct MemoryStore {
    queue: Vec<QueuedTrack>,
    current_track: CurrentTrack,
}

impl Default for MemoryStore {
    fn default() -> Self {
        Self {
            queue: Default::default(),
            current_track: CurrentTrack::None,
        }
    }
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

    async fn previous_queue(&self, _max_playlists: u64) -> Result<Vec<Vec<QueuedTrack>>> {
        Ok(vec![])
    }

    async fn playlist(&self) -> Result<Playlist> {
        Ok(Playlist {
            current_track: self.current_track,
        })
    }

    async fn set_current_track(&mut self, current_track: CurrentTrack) -> Result<()> {
        self.current_track = current_track;
        Ok(())
    }
}
