use std::sync::Arc;

use serenity::{async_trait, builder::CreateApplicationCommand};

use crate::command_context::CommandContext;

pub mod ping;
pub mod play;

#[async_trait]
pub trait JoovyCommand {
    fn name(&self) -> &str;

    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand;

    async fn execute(&self, ctx: Arc<CommandContext>) -> anyhow::Result<()>;
}
