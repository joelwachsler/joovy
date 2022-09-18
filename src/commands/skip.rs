use std::sync::Arc;

use anyhow::Result;
use serenity::builder::CreateApplicationCommand;
use serenity::{async_trait, model::prelude::command::CommandOptionType::Integer};

use crate::command_context::CommandContext;
use crate::store::guild_action::play_next_track::PlayNextTrack;
use crate::store::guild_action::remove::Remove;

use super::{CommandDataOptionUtil, JoovyCommand, JoovyCommands};

const FROM: &str = "from";
const TO: &str = "to";

#[derive(Default, Debug)]
pub struct Skip;

#[async_trait]
impl JoovyCommand for Skip {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name(JoovyCommands::Skip(Skip).as_ref())
            .description("Removes tracks from the queue. If no arguments are given, the current track will be skipped.")
            .create_option(|option| {
                option
                    .name(FROM)
                    .kind(Integer)
                    .description("Start number to remove from (inclusive)")
                    .min_int_value(0)
                    .required(false)
            })
            .create_option(|option| {
                option
                    .name(TO)
                    .kind(Integer)
                    .description("End number to remove to (inclusive)")
                    .min_int_value(1)
            })
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let options = &ctx.interaction().data.options;

        if let Some(from) = options.get_u64(FROM) {
            let to = options.get_u64(TO);

            ctx.send_action(Remove::builder().ctx(ctx.clone()).from(from).to(to).build())
                .await?;
        } else {
            // from is not defined, let's skip the current track
            ctx.send_action(
                PlayNextTrack::builder()
                    .ctx(ctx.clone())
                    .force(true)
                    .build(),
            )
            .await?;
        }

        Ok(())
    }
}
