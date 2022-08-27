use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::prelude::command;

use crate::{command_context::CommandContext, store::guild_action::add_track_to_queue::AddToQueue};

use super::{JoovyCommand, JoovyCommands};

#[derive(Default, Debug)]
pub struct Play;

#[async_trait]
impl JoovyCommand for Play {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name(JoovyCommands::Play(Play).as_ref())
            .description("Tries to add the provided query or url to the queue")
            .create_option(|option| {
                option
                    .name("query")
                    .description("A query or url to try to add to the queue")
                    .kind(command::CommandOptionType::String)
                    .required(true)
            })
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let query = ctx.command_value();
        let _ = ctx
            .send_action(AddToQueue::builder().ctx(ctx.clone()).query(query).build())
            .await;

        Ok(())
    }
}
