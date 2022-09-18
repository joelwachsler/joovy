use enum_dispatch::enum_dispatch;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::builder::CreateApplicationCommands;
use serenity::model::application::command::Command;
use serenity::model::prelude::interaction::application_command::CommandDataOption;
use serenity::model::prelude::interaction::Interaction;
use serenity::model::prelude::GuildId;
use serenity::model::prelude::Ready;
use serenity::prelude::Context;
use serenity::prelude::EventHandler;
use std::env;
use std::str::FromStr;
use std::sync::Arc;
use strum::AsRefStr;
use strum::EnumIter;
use strum::EnumString;
use strum::IntoEnumIterator;
use tracing::{debug, error, info};

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

pub struct CommandHandler;

#[async_trait]
impl EventHandler for CommandHandler {
    async fn ready(&self, ctx: Context, ready: Ready) {
        info!("{} is connected!", ready.user.name);
        info!("Registering slash commands...");

        let guild_id = env::var("GUILD_ID")
            .map(|guild_id| guild_id.parse().expect("GUILD_ID must be an integer"))
            .map(GuildId)
            .ok();

        if let Some(guild_id) = guild_id {
            info!("Registering guild application commands");
            let _ = GuildId::set_application_commands(&guild_id, ctx, |commands| {
                JoovyCommands::register_application_commands(commands)
            })
            .await
            .unwrap_or_else(|why| panic!("Failed to create guild slash commands: {}", why));
        } else {
            info!("Registering global application commands");
            Command::set_global_application_commands(&ctx, |commands| {
                JoovyCommands::register_application_commands(commands)
            })
            .await
            .unwrap_or_else(|why| panic!("Failed to create global slash commands: {}", why));
        }

        info!("Finished and ready to serve!");
    }

    async fn interaction_create(&self, ctx: Context, interaction: Interaction) {
        if let Interaction::ApplicationCommand(command) = interaction {
            let cmd_name = command.data.name.as_str();
            let found_cmd = JoovyCommands::from_str(cmd_name).ok();
            debug!("Trying to command {}, found: {:?}", cmd_name, found_cmd);
            let cmd_context = Arc::new(CommandContext::new(ctx.clone(), command.clone()));

            if let Some(command) = found_cmd {
                let _ = cmd_context.reply_ack("Processing...").await;

                let exec_res = command.execute(cmd_context.clone()).await;
                if let Err(why) = exec_res {
                    let _ = cmd_context
                        .reply(format!("Failed to execute: {}, reason: {}", cmd_name, why))
                        .await;
                };
            } else {
                let _ = cmd_context
                    .reply_ack(format!("No command named: {}, was found", cmd_name))
                    .await
                    .map_err(|why| error!("Failed to reply: {}", why));
            }
        } else {
            error!("Unhandled interaction: {:?}", interaction);
        }
    }
}
