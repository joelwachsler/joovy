use std::sync::Arc;

use anyhow::Result;
use rand::{seq::SliceRandom, thread_rng};
use serenity::async_trait;
use tracing::info;
use typed_builder::TypedBuilder;

use super::{add_track_to_queue::AddToQueue, GuildStore};
use crate::{
    command_context::CommandContext,
    store::guild_action::{Execute, HasCtx},
};

#[async_trait]
impl Execute for RegenerateQueue {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        let RegenerateQueue { ctx, shuffle } = self;
        let mut prev_queue = match store.store().get_previous_queue().await? {
            Some(queue) => queue,
            None => {
                ctx.send("No previous queue was found...").await?;
                return Ok(());
            }
        };

        if *shuffle {
            info!("Randomizing queue...");
            prev_queue.shuffle(&mut thread_rng());
        }

        info!("Found the following entries in the previous queue: {prev_queue:?}");

        for track in prev_queue {
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
}

impl HasCtx for RegenerateQueue {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}
