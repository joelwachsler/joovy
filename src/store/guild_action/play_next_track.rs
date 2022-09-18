use anyhow::Result;
use serenity::async_trait;
use songbird::{Event, TrackEvent};
use songbird::{EventContext, EventHandler as SongbirdEventHandler};
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::time;
use tracing::info;
use typed_builder::TypedBuilder;

use super::disconnect::Disconnect;
use super::GuildStore;
use crate::command_context::voice::IntoInput;
use crate::command_context::CommandContext;
use crate::store::guild_action::{Execute, HasCtx};
use crate::store::queued_track::QueuedTrack;

#[async_trait]
impl Execute for PlayNextTrack {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        let PlayNextTrack { ctx, force } = self;

        if let Some(disconnect_handle) = &store.disconnect_handle {
            disconnect_handle.send(())?;
            store.disconnect_handle = None;
        }

        if store.is_playing().await? && !force {
            info!("Already playing a track, skipping.");
            return Ok(());
        } else if let Some(current_track) = store.current_track().await? {
            ctx.reply(format!("Skipping {}", current_track.name()))
                .await?;
        }

        let handler_lock = ctx.songbird_call_lock().await?;
        let mut handler = handler_lock.lock().await;

        if let Some(next_track) = next_track(store).await? {
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
            let _ = ctx
                .send("End of playlist, will disconnect in 5 minutes.")
                .await;

            let (abort_handle, abort) = broadcast::channel(1);
            start_disconnect_timer(ctx.clone(), abort);
            store.disconnect_handle = Some(abort_handle);
        }

        Ok(())
    }
}

async fn next_track(store: &mut GuildStore) -> Result<Option<QueuedTrack>> {
    while let Some(next_track) = store.next_track_in_queue().await? {
        if !next_track.should_skip() {
            return Ok(Some(next_track));
        } else {
            info!("Skipping {}", next_track.name());
        }
    }

    Ok(None)
}

fn start_disconnect_timer(ctx: Arc<CommandContext>, mut abort: broadcast::Receiver<()>) {
    tokio::spawn(async move {
        let cloned_ctx = ctx.clone();
        tokio::select! {
            _ = abort.recv() => {
                info!("Aborted");
            },
            _ = time::sleep(time::Duration::from_secs(60 * 5)) => {
                info!("Sending disconnect request");
                let _ = ctx
                    .send_action(Disconnect::builder().ctx(cloned_ctx).build())
                    .await;
            },
        }
    });
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
