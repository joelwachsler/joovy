use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::builder::CreateApplicationCommands;
use std::sync::Arc;

use strum::EnumIter;
use strum::IntoEnumIterator;

use crate::command_context::CommandContext;

use self::ping::Ping;
use self::play::Play;

pub mod ping;
pub mod play;
// pub mod disconnect;

#[async_trait]
pub trait JoovyCommand {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand;

    async fn execute(&self, ctx: Arc<CommandContext>) -> anyhow::Result<()>;
}

#[derive(EnumIter, Debug)]
pub enum JoovyCommands {
    Play(Play),
    Ping(Ping),
}

impl JoovyCommands {
    pub fn from_str(str: &str) -> Option<JoovyCommands> {
        match str {
            "play" => Some(Self::Play(Play)),
            "ping" => Some(Self::Ping(Ping)),
            _ => None,
        }
    }

    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        match self {
            JoovyCommands::Play(p) => p.create_application_command(command),
            JoovyCommands::Ping(p) => p.create_application_command(command),
        }
    }

    pub async fn execute(&self, ctx: Arc<CommandContext>) -> anyhow::Result<()> {
        match self {
            JoovyCommands::Play(p) => p.execute(ctx).await,
            JoovyCommands::Ping(p) => p.execute(ctx).await,
        }
    }

    pub fn register_application_commands(
        commands: &mut CreateApplicationCommands,
    ) -> &mut CreateApplicationCommands {
        JoovyCommands::iter().fold(commands, |cmds, cmd| {
            cmds.create_application_command(|command| cmd.create_application_command(command))
        })
    }
}
