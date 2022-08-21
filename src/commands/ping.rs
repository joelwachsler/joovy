use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;

use super::{CommandContext, JoovyCommand};

#[derive(Default)]
pub struct Ping;

#[async_trait]
impl JoovyCommand for Ping {
    fn name(&self) -> &str {
        "ping"
    }

    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command.name("ping").description("Ping!")
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        ctx.send("Pong!").await?;
        Ok(())
    }
}
