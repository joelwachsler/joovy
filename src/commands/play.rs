use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::prelude::command;

use crate::command_context::CommandContext;

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

    async fn execute<'a>(&self, ctx: &CommandContext<'a>) -> Result<()> {
        ctx.join_voice().await?;

        let handler = ctx.songbird().await;

        if let Some(handler_lock) = handler.get(ctx.interaction().guild_id.unwrap()) {
            let mut handler = handler_lock.lock().await;

            let query = ctx.value();
            let search_result = search::search(&query).await?;

            ctx.send(format!("Trying to start: {}", search_result.title()))
                .await?;

            let input = songbird::ytdl(search_result.url()).await?;
            handler.play_source(input);
            ctx.send(format!("Now playing {}", search_result.title()))
                .await?;
        }

        Ok(())
    }
}
