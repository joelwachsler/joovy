use anyhow::{bail, Result};
use std::{fmt::Display, sync::Arc};
use tracing::{error, info};

use serenity::model::application::interaction::InteractionResponseType;
use serenity::{
    async_trait,
    builder::CreateApplicationCommand,
    model::{
        application::interaction::application_command::ApplicationCommandInteraction,
        prelude::Guild,
    },
    prelude::Context,
};
use songbird::Songbird;

// mod disconnect;
pub mod play;

pub struct CommandContext<'a> {
    ctx: &'a Context,
    interaction: &'a ApplicationCommandInteraction,
}

impl<'a> CommandContext<'a> {
    pub fn new(ctx: &'a Context, interaction: &'a ApplicationCommandInteraction) -> Self {
        Self { ctx, interaction }
    }

    pub async fn songbird(&self) -> Arc<Songbird> {
        songbird::get(self.ctx)
            .await
            .expect("Songbird Voice client failed")
    }

    pub async fn reply(&self, msg: impl Display) -> Result<()> {
        info!("{}", msg);
        let _ = self
            .interaction
            .create_interaction_response(self.ctx, |response| {
                response
                    .kind(InteractionResponseType::ChannelMessageWithSource)
                    .interaction_response_data(|message| message.content(msg))
            })
            .await
            .map_err(|why| error!("Failed to create response: {}", why));

        Ok(())
    }

    pub fn guild(&self) -> Result<Guild> {
        let guild = match self.interaction.guild_id {
            Some(g) => g,
            None => bail!("Guild not found"),
        };
        let cached_guild = match guild.to_guild_cached(self.ctx) {
            Some(g) => g,
            None => bail!("Guild not found in cache"),
        };

        Ok(cached_guild)
    }

    pub async fn join_voice(&self) -> Result<()> {
        let guild = self.guild()?;
        let author_id = self.interaction.user.id;
        let voice_state = match guild.voice_states.get(&author_id) {
            Some(state) => state,
            None => {
                self.reply("Not in a voice channel").await?;
                return Ok(());
            }
        };

        let channel_id = match voice_state.channel_id {
            Some(channel) => channel,
            None => {
                error!("Failed to get channel id");
                return Ok(());
            }
        };

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

#[async_trait]
pub trait JoovyCommand {
    fn name(&self) -> &str;

    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand;

    async fn execute<'a>(&self, ctx: CommandContext<'a>) -> anyhow::Result<()>;
}
