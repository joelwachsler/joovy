use enum_dispatch::enum_dispatch;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::builder::CreateApplicationCommands;
use serenity::model::prelude::interaction::application_command::CommandDataOption;
use std::sync::Arc;
use strum::AsRefStr;
use strum::EnumString;

use strum::EnumIter;
use strum::IntoEnumIterator;

use crate::command_context::CommandContext;

use self::disconnect::Disconnect;
use self::play::Play;
use self::queue::Queue;
use self::regenerate::Regenerate;
use self::skip::Skip;
use self::skip_last::SkipLast;

mod disconnect;
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

trait CommandDataOptionUtil {
    fn get_bool(&self, name: &str) -> Option<bool>;
    fn get_u64(&self, name: &str) -> Option<u64>;
}

impl CommandDataOptionUtil for Vec<CommandDataOption> {
    fn get_bool(&self, name: &str) -> Option<bool> {
        self.iter()
            .find(|opt| opt.name == name)
            .and_then(|v| v.value.clone())
            .and_then(|v| v.as_bool())
    }

    fn get_u64(&self, name: &str) -> Option<u64> {
        self.iter()
            .find(|opt| opt.name == name)
            .and_then(|v| v.value.clone())
            .and_then(|v| v.as_u64())
    }
}
