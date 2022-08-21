use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;

use super::{CommandContext, JoovyCommand, JoovyCommands};

#[derive(Default, Debug)]
pub struct Ping;

#[async_trait]
impl JoovyCommand for Ping {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name(JoovyCommands::Ping(Ping).as_ref())
            .description("Ping!")
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        ctx.send("Pong!").await?;
        Ok(())
    }
}
