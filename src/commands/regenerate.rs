use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::prelude::command::CommandOptionType::Boolean;

use crate::command_context::CommandContext;
use crate::store::guild_action::regenerate_queue::RegenerateQueue;

use super::{JoovyCommand, JoovyCommands};

const SHUFFLE: &str = "shuffle";

#[derive(Default, Debug)]
pub struct Regenerate;

#[async_trait]
impl JoovyCommand for Regenerate {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name(JoovyCommands::Regenerate(Regenerate).as_ref())
            .description("Regenerates the last playlist")
            .create_option(|option| {
                option
                    .name(SHUFFLE)
                    .kind(Boolean)
                    .description("Shuffle the playlist order when regenerating it")
                    .required(false)
            })
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let options = &ctx.interaction().data.options;
        let get_bool_opt = |name| {
            options
                .iter()
                .find(|opt| opt.name == name)
                .and_then(|v| v.value.clone())
                .and_then(|v| v.as_bool())
        };

        let shuffle = get_bool_opt(SHUFFLE).unwrap_or_default();

        ctx.send_action(
            RegenerateQueue::builder()
                .ctx(ctx.clone())
                .shuffle(shuffle)
                .build(),
        )
        .await?;

        Ok(())
    }
}
