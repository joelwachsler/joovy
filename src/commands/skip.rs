use std::sync::Arc;

use anyhow::Result;
use serenity::builder::CreateApplicationCommand;
use serenity::{async_trait, model::prelude::command::CommandOptionType::Integer};

use crate::{command_context::CommandContext, store::guild_store_action::GuildStoreAction};

use super::{JoovyCommand, JoovyCommands};

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
            .description("Removes tracks from the queue. If from is not defined the current track will be skipped.")
            .create_option(|option| {
                option
                    .name(FROM)
                    .kind(Integer)
                    .description("Start number to remove from (inclusive)")
                    .required(false)
            })
            .create_option(|option| {
                option
                    .name(TO)
                    .kind(Integer)
                    .description("End number to remove to (inclusive)")
            })
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let options = &ctx.interaction().data.options;
        let get_int_opt = |name| {
            options
                .iter()
                .find(|opt| opt.name == name)
                .and_then(|v| v.value.clone())
                .and_then(|v| v.as_u64())
        };

        if let Some(from) = get_int_opt(FROM) {
            let to = get_int_opt(TO);

            ctx.send_action(GuildStoreAction::Remove(ctx.clone(), from, to))
                .await?;
        } else {
            // from is not defined, let's skip the current track
            ctx.send_action(GuildStoreAction::PlayNextTrack(ctx.clone(), true))
                .await?;
        }

        Ok(())
    }
}
