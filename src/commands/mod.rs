use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::builder::CreateApplicationCommands;
use std::sync::Arc;
use strum::AsRefStr;
use strum::EnumString;

use strum::EnumIter;
use strum::IntoEnumIterator;

use crate::command_context::CommandContext;

use self::disconnect::Disconnect;
use self::ping::Ping;
use self::play::Play;
use self::queue::Queue;
use self::skip::Skip;
use self::skip_last::SkipLast;

mod disconnect;
mod ping;
mod play;
mod queue;
mod skip;
mod skip_last;

#[async_trait]
pub trait JoovyCommand {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand;

    async fn execute(&self, ctx: Arc<CommandContext>) -> anyhow::Result<()>;
}

#[derive(EnumIter, Debug, EnumString, AsRefStr)]
#[strum(serialize_all = "snake_case")]
pub enum JoovyCommands {
    Play(Play),
    Ping(Ping),
    Disconnect(Disconnect),
    Skip(Skip),
    SkipLast(SkipLast),
    Queue(Queue),
}

// the command registration could be simplified using a macro
impl JoovyCommands {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        match self {
            JoovyCommands::Play(cmd) => cmd.create_application_command(command),
            JoovyCommands::Ping(cmd) => cmd.create_application_command(command),
            JoovyCommands::Disconnect(cmd) => cmd.create_application_command(command),
            JoovyCommands::Skip(cmd) => cmd.create_application_command(command),
            JoovyCommands::SkipLast(cmd) => cmd.create_application_command(command),
            JoovyCommands::Queue(cmd) => cmd.create_application_command(command),
        }
    }

    pub async fn execute(&self, ctx: Arc<CommandContext>) -> anyhow::Result<()> {
        match self {
            JoovyCommands::Play(cmd) => cmd.execute(ctx).await,
            JoovyCommands::Ping(cmd) => cmd.execute(ctx).await,
            JoovyCommands::Disconnect(cmd) => cmd.execute(ctx).await,
            JoovyCommands::Skip(cmd) => cmd.execute(ctx).await,
            JoovyCommands::SkipLast(cmd) => cmd.execute(ctx).await,
            JoovyCommands::Queue(cmd) => cmd.execute(ctx).await,
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
