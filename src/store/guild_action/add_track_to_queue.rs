use anyhow::Result;
use serenity::async_trait;
use std::sync::Arc;
use typed_builder::TypedBuilder;

use crate::{
    command_context::CommandContext,
    store::{
        guild_action::{Execute, HasCtx},
        guild_store::GuildStore,
        queued_track::QueuedTrack,
    },
};

use super::play_next_track::PlayNextTrack;

#[async_trait]
impl Execute for AddToQueue {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        let AddToQueue { ctx, query } = self;

        let new_track = QueuedTrack::try_from_query(ctx, query).await?;
        let new_track_name = new_track.name();
        store.add_to_queue_internal(new_track);

        ctx.send(format!("{} has been added to the queue", new_track_name))
            .await?;

        if !store.is_playing() {
            PlayNextTrack::builder()
                .ctx(ctx.clone())
                .build()
                .execute(store)
                .await?;
        }

        Ok(())
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
        assert!(!store.is_playing());
        store.add_to_queue_internal(QueuedTrack::create_for_test("foo"));
        assert!(!store.is_playing());
        assert_eq!(store.next_track_in_queue().unwrap().title(), "foo");
        assert!(store.is_playing());
        assert_eq!(store.next_track_in_queue(), None);
        assert!(!store.is_playing());
        store.add_to_queue_internal(QueuedTrack::create_for_test("bar"));
        assert_eq!(store.next_track_in_queue().unwrap().title(), "bar");
        assert!(store.is_playing());
    }
}
