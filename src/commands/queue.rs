use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;

use crate::{command_context::CommandContext, store::guild_store_action::GuildStoreAction};

use super::{JoovyCommand, JoovyCommands};

#[derive(Default, Debug)]
pub struct Queue;

#[async_trait]
impl JoovyCommand for Queue {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name(JoovyCommands::Queue(Queue).as_ref())
            .description("Displays the track queue")
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let _ = ctx
            .send_action(GuildStoreAction::PrintQueue(ctx.clone()))
            .await;

        Ok(())
    }
}
