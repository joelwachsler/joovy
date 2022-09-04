use std::sync::Arc;

use anyhow::Result;
use rand::{seq::SliceRandom, thread_rng};
use serenity::async_trait;
use tracing::info;
use typed_builder::TypedBuilder;

use super::{add_track_to_queue::AddToQueue, GuildStore};
use crate::{
    command_context::CommandContext,
    store::{
        guild_action::{Execute, HasCtx},
        queued_track::QueuedTrack,
    },
};

#[async_trait]
impl Execute for RegenerateQueue {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        let RegenerateQueue {
            ctx,
            shuffle,
            dedup,
            go_back,
            max_tracks,
        } = self;

        let mut prev_tracks: Vec<QueuedTrack> = store
            .store()
            .get_previous_queue(*go_back)
            .await?
            .into_iter()
            .flatten()
            .collect();

        if *dedup {
            info!("Deduplicating queue...");
            prev_tracks = prev_tracks
                .get_unique_tracks()
                .into_iter()
                .cloned()
                .collect();
        }

        if *shuffle {
            info!("Randomizing queue...");
            prev_tracks.shuffle(&mut thread_rng());
        }

        let prev_tracks: Vec<QueuedTrack> = prev_tracks.into_iter().take(*max_tracks).collect();

        for track in prev_tracks {
            // this track was skipped which probably means it was added erroneously
            if track.skip {
                continue;
            }

            ctx.send_action(AddToQueue::builder().ctx(ctx.clone()).track(track).build())
                .await?;
        }

        Ok(())
    }
}

#[derive(TypedBuilder)]
pub struct RegenerateQueue {
    ctx: Arc<CommandContext>,
    pub shuffle: bool,
    pub dedup: bool,
    pub go_back: u64,
    pub max_tracks: usize,
}

impl HasCtx for RegenerateQueue {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}

trait UniqueTracks {
    // Filters out tracks with unique urls.
    fn get_unique_tracks(&self) -> Vec<&QueuedTrack>;
}

impl UniqueTracks for Vec<QueuedTrack> {
    fn get_unique_tracks(&self) -> Vec<&QueuedTrack> {
        use std::collections::HashSet;

        let mut already_present: HashSet<&str> = HashSet::new();
        self.iter()
            .filter(|item| {
                if already_present.contains(item.url()) {
                    false
                } else {
                    already_present.insert(item.url());
                    true
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dedup_unique() {
        let queue = vec![
            QueuedTrack::create_for_test_two("first", "first"),
            QueuedTrack::create_for_test_two("second", "second"),
        ];
        assert_eq!(unique_track_names(&queue), vec!["first", "second"]);
    }

    #[test]
    fn dedup_not_unique() {
        let queue = vec![
            QueuedTrack::create_for_test_two("first", "first"),
            QueuedTrack::create_for_test_two("first", "first"),
        ];
        assert_eq!(unique_track_names(&queue), vec!["first"]);
    }

    #[test]
    fn dedup_empty() {
        let queue = vec![];
        assert_eq!(unique_track_names(&queue), vec![] as Vec<&str>);
    }

    fn unique_track_names(queue: &Vec<QueuedTrack>) -> Vec<&str> {
        queue
            .get_unique_tracks()
            .iter()
            .map(|item| item.url())
            .collect()
    }
}
