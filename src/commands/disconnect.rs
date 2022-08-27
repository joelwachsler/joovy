use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;

use crate::command_context::CommandContext;
use crate::store::guild_store::disconnect::DisconnectBuilder;

use super::{JoovyCommand, JoovyCommands};

#[derive(Default, Debug)]
pub struct Disconnect;

#[async_trait]
impl JoovyCommand for Disconnect {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name(JoovyCommands::Disconnect(Disconnect).as_ref())
            .description("Disconnects from the voice channel")
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let _ = ctx
            .send_action(
                DisconnectBuilder::default()
                    .ctx(ctx.clone())
                    .build()
                    .unwrap(),
            )
            .await;

        Ok(())
    }
}
