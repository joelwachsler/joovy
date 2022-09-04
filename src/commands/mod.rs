use enum_dispatch::enum_dispatch;
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
use self::regenerate::Regenerate;
use self::skip::Skip;
use self::skip_last::SkipLast;

mod disconnect;
mod ping;
mod play;
mod queue;
mod regenerate;
mod skip;
mod skip_last;

#[async_trait]
#[enum_dispatch(JoovyCommands)]
pub trait JoovyCommand {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand;

    async fn execute(&self, ctx: Arc<CommandContext>) -> anyhow::Result<()>;
}

#[enum_dispatch]
#[derive(EnumIter, Debug, EnumString, AsRefStr)]
#[strum(serialize_all = "snake_case")]
pub enum JoovyCommands {
    Play,
    Ping,
    Disconnect,
    Skip,
    SkipLast,
    Queue,
    Regenerate,
}

impl JoovyCommands {
    pub fn register_application_commands(
        commands: &mut CreateApplicationCommands,
    ) -> &mut CreateApplicationCommands {
        JoovyCommands::iter().fold(commands, |cmds, cmd| {
            cmds.create_application_command(|command| cmd.create_application_command(command))
        })
    }
}
