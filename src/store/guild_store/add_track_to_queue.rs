use anyhow::Result;
use serenity::async_trait;
use std::sync::Arc;
use typed_builder::TypedBuilder;

use crate::{
    command_context::CommandContext,
    store::{
        guild_store::GuildStore,
        guild_store_action::{Execute, HasCtx},
        queued_track::QueuedTrack,
    },
};

use super::play_next_track::PlayNextTrack;

impl GuildStore {
    pub async fn add_to_queue(&mut self, args: &AddToQueue) -> Result<()> {
        let AddToQueue { ctx, query } = args;

        let new_track = QueuedTrack::try_from_query(&ctx, &query).await?;
        let new_track_name = new_track.name();
        self.add_to_queue_internal(new_track);

        ctx.send(format!("{} has been added to the queue", new_track_name))
            .await?;

        if !self.is_playing() {
            self.play_next_track(&PlayNextTrack::builder().ctx(ctx.clone()).build().into())
                .await?;
        }

        Ok(())
    }

    fn add_to_queue_internal(&mut self, track: QueuedTrack) {
        self.queue.push(track);
    }
}

#[derive(TypedBuilder)]
pub struct AddToQueue {
    ctx: Arc<CommandContext>,
    pub query: String,
}

impl HasCtx for AddToQueue {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}

#[async_trait]
impl Execute for AddToQueue {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        store.add_to_queue(self).await
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
