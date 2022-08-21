use anyhow::{bail, Result};
use serenity::{async_trait, prelude::*};
use std::sync::Arc;

use songbird::{input::Input, Songbird};

use crate::store::queued_track::QueuedTrack;

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
