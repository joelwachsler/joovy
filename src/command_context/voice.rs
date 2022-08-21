use anyhow::{bail, Result};
use serenity::{async_trait, prelude::*};
use std::sync::Arc;

use songbird::{
    input::Input, Event, EventContext, EventHandler as SongbirdEventHandler, Songbird, TrackEvent,
};

use crate::store::{guild_store::HasGuildStore, queued_track::QueuedTrack};

use super::CommandContext;

impl CommandContext {
    pub async fn songbird_call_lock(&self) -> Result<Arc<Mutex<songbird::Call>>> {
        let manager = self.songbird().await;
        let handler_lock = match manager.get(self.interaction().guild_id.unwrap()) {
            Some(lock) => lock,
            None => bail!("Failed to get handler lock"),
        };

        Ok(handler_lock)
    }

    pub async fn join_voice(&self) -> Result<()> {
        let guild = self.guild()?;
        let channel_id = self.voice_channel_id().await?;

        let manager = self.songbird().await;
        let _ = manager.join(guild.id, channel_id).await;

        Ok(())
    }

    async fn songbird(&self) -> Arc<Songbird> {
        songbird::get(&self.ctx)
            .await
            .expect("Songbird Voice client failed")
    }
}

#[async_trait]
pub trait IntoInput {
    async fn to_input(&self) -> Result<Input>;
}

#[async_trait]
impl IntoInput for QueuedTrack {
    async fn to_input(&self) -> Result<Input> {
        let res = songbird::ytdl(self.url()).await?;
        Ok(res)
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

#[async_trait]
impl SongbirdEventHandler for SongEndNotifier {
    async fn act(&self, _: &EventContext<'_>) -> Option<Event> {
        play_next_track(self.ctx.clone()).await.unwrap();
        None
    }
}

pub async fn play_next_track(ctx: Arc<CommandContext>) -> Result<()> {
    let store = ctx.guild_store().await;
    if let Some(next_track) = store.next_track_in_queue().await {
        let handler_lock = ctx.songbird_call_lock().await?;

        let mut handler = handler_lock.lock().await;
        let next_input = next_track.to_input().await?;
        let handle = handler.play_source(next_input);
        let _ = handle.add_event(
            Event::Track(TrackEvent::End),
            SongEndNotifier::new(ctx.clone()),
        );

        ctx.send(format!("Now playing {}", next_track.title()))
            .await?;
    } else {
        let _ = ctx.send("End of playlist").await;
    }

    Ok(())
}
