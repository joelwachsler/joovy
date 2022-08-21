use std::sync::Arc;

use anyhow::Result;
use serenity::builder::CreateApplicationCommand;
use serenity::{async_trait, model::prelude::command::CommandOptionType::Integer};

use crate::{command_context::CommandContext, store::guild_store_action::GuildStoreAction};

use super::JoovyCommand;

#[derive(Default, Debug)]
pub struct Remove;

#[async_trait]
impl JoovyCommand for Remove {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name("remove")
            .description("Removes tracks from the queue")
            .create_option(|option| {
                option
                    .name("from")
                    .kind(Integer)
                    .description("Start number to remove from (inclusive)")
                    .required(true)
            })
            .create_option(|option| {
                option
                    .name("to")
                    .kind(Integer)
                    .description("End number to remove to (inclusive)")
            })
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let options = &ctx.interaction().data.options;
        let from = options
            .get(0)
            .and_then(|v| v.value.clone())
            .and_then(|v| v.as_u64())
            .unwrap();

        let to = options
            .get(1)
            .and_then(|v| v.value.clone())
            .and_then(|v| v.as_u64());

        let _ = ctx
            .send_action(GuildStoreAction::Remove(ctx.clone(), from, to))
            .await;

        Ok(())
    }
}
