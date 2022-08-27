use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;

use crate::{command_context::CommandContext, store::guild_store::remove_last::RemoveLast};

use super::{JoovyCommand, JoovyCommands};

#[derive(Default, Debug)]
pub struct SkipLast;

#[async_trait]
impl JoovyCommand for SkipLast {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name(JoovyCommands::SkipLast(SkipLast).as_ref())
            .description("Removes the last added track")
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        ctx.send_action(RemoveLast::builder().ctx(ctx.clone()).build())
            .await?;

        Ok(())
    }
}
