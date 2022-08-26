use anyhow::Result;
use serenity::async_trait;
use songbird::{Event, TrackEvent};
use songbird::{EventContext, EventHandler as SongbirdEventHandler};
use std::sync::Arc;
use tracing::info;

use super::{GuildStore, GuildStoreAction};
use crate::command_context::voice::IntoInput;
use crate::command_context::CommandContext;

impl GuildStore {
    pub async fn play_next_track(&mut self, ctx: Arc<CommandContext>, force: bool) -> Result<()> {
        if self.is_playing() && !force {
            info!("Already playing a track, skipping.");
            return Ok(());
        } else if let Some(current_track) = self.current_track() {
            ctx.reply(format!("Skipping {}", current_track.name()))
                .await?;
        }

        let mut next_track = || {
            while let Some(next_track) = self.next_track_in_queue() {
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
            .send_action(GuildStoreAction::PlayNextTrack(self.ctx.clone(), false))
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