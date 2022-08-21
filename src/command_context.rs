use anyhow::{bail, Result};
use serenity::model::prelude::ChannelId;
use std::{fmt::Display, sync::Arc};
use tracing::{error, info};

use serenity::model::application::interaction::InteractionResponseType;
use serenity::{
    model::{
        application::interaction::application_command::ApplicationCommandInteraction,
        prelude::Guild,
    },
    prelude::Context,
};
use songbird::Songbird;

use crate::guild_store::{GuildStore, GuildStores};

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

    pub async fn guild_store(&self) -> Arc<GuildStore> {
        let data_read = self.ctx.data.read().await;
        let guild_stores = data_read.get::<GuildStores>().unwrap().clone();
        let channel_id = self.text_channel_id().await;
        guild_stores.get_or_create_store(channel_id.0).await
    }

    pub async fn songbird(&self) -> Arc<Songbird> {
        songbird::get(&self.ctx)
            .await
            .expect("Songbird Voice client failed")
    }

    /// Should only be used once per slash command to acknowledge the command.
    pub async fn reply_ack(&self, msg: impl Display) -> Result<()> {
        info!("Reply ack with: {}", msg);
        let _ = self
            .interaction
            .create_interaction_response(&self.ctx, |response| {
                response
                    .kind(InteractionResponseType::ChannelMessageWithSource)
                    .interaction_response_data(|message| {
                        message.embed(|embed| embed.description(msg))
                    })
            })
            .await
            .map_err(|why| error!("Failed to create response: {}", why));

        Ok(())
    }

    pub async fn reply(&self, msg: impl Display) -> Result<()> {
        info!("Replying with: {}", msg);
        self.interaction
            .create_followup_message(&self.ctx, |message| {
                message.embed(|embed| embed.description(msg))
            })
            .await?;

        Ok(())
    }

    pub async fn send(&self, msg: impl Display) -> Result<()> {
        info!("Sending: {}", msg);
        self.text_channel_id()
            .await
            .send_message(&self.ctx, |message| {
                message.embed(|embed| embed.description(msg))
            })
            .await?;

        Ok(())
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

    async fn text_channel_id(&self) -> ChannelId {
        self.interaction.channel_id
    }

    pub async fn join_voice(&self) -> Result<()> {
        let guild = self.guild()?;
        let channel_id = self.voice_channel_id().await?;

        let manager = self.songbird().await;
        let _ = manager.join(guild.id, channel_id).await;

        Ok(())
    }

    pub fn value(&self) -> String {
        let options = &self.interaction.data.options;
        let value = options.get(0).unwrap().value.clone();
        value.unwrap().as_str().unwrap().to_string()
    }
}
