use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::prelude::command;

use crate::{
    command_context::CommandContext,
    store::guild_stores::{GuildStoreAction, HasGuildStores},
};

use super::JoovyCommand;

#[derive(Default)]
pub struct Play;

#[async_trait]
impl JoovyCommand for Play {
    fn name(&self) -> &str {
        "play"
    }

    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name("play")
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
            .guild_stores()
            .await
            .sender()
            .send(GuildStoreAction::AddToQueue(ctx, query))
            .await;

        Ok(())
    }
}
