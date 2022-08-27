use anyhow::Result;
use serenity::async_trait;
use songbird::{Event, TrackEvent};
use songbird::{EventContext, EventHandler as SongbirdEventHandler};
use std::sync::Arc;
use tracing::info;
use typed_builder::TypedBuilder;

use super::GuildStore;
use crate::command_context::voice::IntoInput;
use crate::command_context::CommandContext;
use crate::store::guild_store_action::{Execute, HasCtx};

#[async_trait]
impl Execute for PlayNextTrack {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        let PlayNextTrack { ctx, force } = self;

        if store.is_playing() && !force {
            info!("Already playing a track, skipping.");
            return Ok(());
        } else if let Some(current_track) = store.current_track() {
            ctx.reply(format!("Skipping {}", current_track.name()))
                .await?;
        }

        let mut next_track = || {
            while let Some(next_track) = store.next_track_in_queue() {
                if !next_track.should_skip() {
                    return Some(next_track);
                } else {
                    info!("Skipping {}", next_track.name());
                }
            }

            None
        };

        let handler_lock = ctx.songbird_call_lock().await?;
        let mut handler = handler_lock.lock().await;

        if let Some(next_track) = next_track() {
            let next_input = next_track.to_input().await?;
            let handle = handler.play_only_source(next_input);
            let _ = handle.add_event(
                Event::Track(TrackEvent::End),
                SongEndNotifier::new(ctx.clone()),
            );

            ctx.send(format!("Now playing: {}", next_track.name()))
                .await?;
        } else {
            handler.stop();
            let _ = ctx.send("End of playlist").await;
        }

        Ok(())
    }
}

#[async_trait]
impl SongbirdEventHandler for SongEndNotifier {
    async fn act(&self, _: &EventContext<'_>) -> Option<Event> {
        let _ = self
            .ctx
            .send_action(PlayNextTrack::builder().ctx(self.ctx.clone()).build())
            .await;

        None
    }
}

struct SongEndNotifier {
    ctx: Arc<CommandContext>,
}

impl SongEndNotifier {
    fn new(ctx: Arc<CommandContext>) -> Self {
        Self { ctx }
    }
}

#[derive(TypedBuilder)]
pub struct PlayNextTrack {
    ctx: Arc<CommandContext>,
    #[builder(default)]
    pub force: bool,
}

impl HasCtx for PlayNextTrack {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}
