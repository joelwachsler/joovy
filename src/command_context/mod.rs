mod messaging;

use anyhow::{bail, Result};
use serenity::model::prelude::ChannelId;
use std::sync::Arc;

use serenity::{
    model::{
        application::interaction::application_command::ApplicationCommandInteraction,
        prelude::Guild,
    },
    prelude::Context,
};
use songbird::Songbird;

pub struct CommandContext {
    ctx: Context,
    interaction: ApplicationCommandInteraction,
}

impl CommandContext {
    pub fn new(ctx: Context, interaction: ApplicationCommandInteraction) -> Self {
        Self { ctx, interaction }
    }

    pub fn interaction(&self) -> &ApplicationCommandInteraction {
        &self.interaction
    }

    pub fn ctx(&self) -> &Context {
        &self.ctx
    }

    pub async fn songbird(&self) -> Arc<Songbird> {
        songbird::get(&self.ctx)
            .await
            .expect("Songbird Voice client failed")
    }

    pub fn guild(&self) -> Result<Guild> {
        let guild = match self.interaction.guild_id {
            Some(g) => g,
            None => bail!("Guild not found"),
        };
        let cached_guild = match guild.to_guild_cached(&self.ctx) {
            Some(g) => g,
            None => bail!("Guild not found in cache"),
        };

        Ok(cached_guild)
    }

    async fn voice_channel_id(&self) -> Result<ChannelId> {
        let guild = self.guild()?;
        let author_id = self.interaction.user.id;
        let voice_state = match guild.voice_states.get(&author_id) {
            Some(state) => state,
            None => bail!("Not in a voice channel"),
        };

        match voice_state.channel_id {
            Some(channel) => Ok(channel),
            None => bail!("Failed to get channel id"),
        }
    }

    pub async fn text_channel_id(&self) -> ChannelId {
        self.interaction.channel_id
    }

    pub async fn join_voice(&self) -> Result<()> {
        let guild = self.guild()?;
        let channel_id = self.voice_channel_id().await?;

        let manager = self.songbird().await;
        let _ = manager.join(guild.id, channel_id).await;

        Ok(())
    }

    pub fn command_value(&self) -> String {
        let options = &self.interaction.data.options;
        let value = options.get(0).unwrap().value.clone();
        value.unwrap().as_str().unwrap().to_string()
    }
}
