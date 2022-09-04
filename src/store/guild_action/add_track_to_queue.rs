use anyhow::{bail, Result};
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
        let AddToQueue { ctx, query, track } = self;

        let new_track = if let Some(track) = track {
            track.clone()
        } else if let Some(query) = query {
            QueuedTrack::try_from_query(ctx, query, store.store()).await?
        } else {
            bail!("No query or track was defined...")
        };

        let new_track_name = new_track.name();
        store.add_to_queue_internal(&new_track).await?;

        ctx.send(format!("{} has been added to the queue", new_track_name))
            .await?;

        if !store.is_playing().await? {
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
    #[builder(default, setter(strip_option))]
    pub query: Option<String>,
    #[builder(default, setter(strip_option))]
    pub track: Option<QueuedTrack>,
}

impl HasCtx for AddToQueue {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    macro_rules! add_to_queue {
        ($store:expr, $title:expr) => {
            let _ = $store
                .add_to_queue_internal(&QueuedTrack::create_for_test($title))
                .await;
        };
    }

    macro_rules! has_next_track_title {
        ($store:expr, $title:expr) => {
            assert_eq!(
                $store.next_track_in_queue().await.unwrap().unwrap().title(),
                $title
            );
        };
    }

    macro_rules! has_next_in_queue {
        ($store:expr, $item:expr) => {
            assert_eq!($store.next_track_in_queue().await.unwrap(), $item);
        };
    }

    macro_rules! is_playing {
        ($store:expr, $playing:expr) => {
            assert_eq!($store.is_playing().await.unwrap(), $playing);
        };
    }

    #[tokio::test]
    async fn empty_queue() {
        let mut store = GuildStore::default();
        has_next_in_queue!(store, None);
    }

    #[tokio::test]
    async fn single_item() {
        let mut store = GuildStore::default();
        add_to_queue!(store, "foo");
        has_next_track_title!(store, "foo");
    }

    #[tokio::test]
    async fn multiple_items() {
        let mut store = GuildStore::default();
        add_to_queue!(store, "foo");
        add_to_queue!(store, "bar");
        has_next_track_title!(store, "foo");
        has_next_track_title!(store, "bar");
    }

    #[tokio::test]
    async fn index_handling() {
        let mut store = GuildStore::default();

        has_next_in_queue!(store, None);
        is_playing!(store, false);
        add_to_queue!(store, "foo");
        is_playing!(store, false);
        has_next_track_title!(store, "foo");
        is_playing!(store, true);
        has_next_in_queue!(store, None);
        is_playing!(store, false);
        add_to_queue!(store, "bar");
        has_next_track_title!(store, "bar");
        is_playing!(store, true);
    }
}
