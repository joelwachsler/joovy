use anyhow::Result;
use std::sync::Arc;

use crate::{
    command_context::CommandContext,
    store::{guild_store::GuildStore, queued_track::QueuedTrack},
};

impl GuildStore {
    pub async fn add_to_queue(&mut self, ctx: Arc<CommandContext>, query: &str) -> Result<()> {
        let new_track = QueuedTrack::try_from_query(&ctx, query).await?;
        let new_track_name = new_track.name();
        self.add_to_queue_internal(new_track);

        ctx.send(format!("{} has been added to the queue", new_track_name))
            .await?;

        if !self.is_playing() {
            self.play_next_track(ctx, false).await?;
        }

        Ok(())
    }

    fn add_to_queue_internal(&mut self, track: QueuedTrack) {
        self.queue.push(track);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_queue() {
        let mut store = GuildStore::default();
        assert_eq!(store.next_track_in_queue(), None);
    }

    #[test]
    fn single_item() {
        let mut store = GuildStore::default();
        store.add_to_queue_internal(QueuedTrack::create_for_test("foo"));
        assert_eq!(store.next_track_in_queue().unwrap().title(), "foo");
    }

    #[test]
    fn multiple_items() {
        let mut store = GuildStore::default();
        store.add_to_queue_internal(QueuedTrack::create_for_test("foo"));
        store.add_to_queue_internal(QueuedTrack::create_for_test("bar"));
        assert_eq!(store.next_track_in_queue().unwrap().title(), "foo");
        assert_eq!(store.next_track_in_queue().unwrap().title(), "bar");
    }

    #[test]
    fn index_handling() {
        let mut store = GuildStore::default();

        assert_eq!(store.next_track_in_queue(), None);
        assert_eq!(store.is_playing(), false);
        store.add_to_queue_internal(QueuedTrack::create_for_test("foo"));
        assert_eq!(store.is_playing(), false);
        assert_eq!(store.next_track_in_queue().unwrap().title(), "foo");
        assert_eq!(store.is_playing(), true);
        assert_eq!(store.next_track_in_queue(), None);
        assert_eq!(store.is_playing(), false);
        store.add_to_queue_internal(QueuedTrack::create_for_test("bar"));
        assert_eq!(store.next_track_in_queue().unwrap().title(), "bar");
        assert_eq!(store.is_playing(), true);
    }
}
