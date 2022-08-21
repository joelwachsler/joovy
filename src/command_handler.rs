use serenity::model::prelude::interaction::Interaction;
use serenity::{async_trait, model::prelude::*, prelude::*};
use std::env;
use std::sync::Arc;
use tracing::{debug, error, info};

use crate::command_context::CommandContext;
use crate::commands::JoovyCommand;

type SendableJoovyCommand = dyn JoovyCommand + Send + Sync;

const COMMANDS: &[&SendableJoovyCommand] =
    &[&crate::commands::play::Play, &crate::commands::ping::Ping];

pub struct CommandHandler;

#[async_trait]
impl EventHandler for CommandHandler {
    async fn ready(&self, ctx: Context, ready: Ready) {
        info!("{} is connected!", ready.user.name);
        info!("Registering slash commands...");

        let guild_id = GuildId(
            env::var("GUILD_ID")
                .expect("GUILD_ID must bed defined")
                .parse()
                .expect("GUILD_ID must be an integer"),
        );

        let _ = GuildId::set_application_commands(&guild_id, ctx, |commands| {
            COMMANDS.iter().fold(commands, |cmds, cmd| {
                cmds.create_application_command(|command| cmd.create_application_command(command))
            })
        })
        .await
        .map_err(|why| error!("Failed to create slash commands: {}", why));

        info!("Finished and ready to serve!");
    }

    async fn interaction_create(&self, ctx: Context, interaction: Interaction) {
        if let Interaction::ApplicationCommand(command) = interaction {
            let cmd_name = command.data.name.as_str();
            let found_cmd = COMMANDS.iter().find(|command| command.name() == cmd_name);
            debug!(
                "Trying to command {}, found: {:?}",
                cmd_name,
                found_cmd.map(|m| m.name())
            );
            let cmd_context = Arc::new(CommandContext::new(ctx.clone(), command.clone()));

            if let Some(res) = found_cmd {
                let _ = cmd_context.reply_ack("Processing...").await;

                let exec_res = res.execute(cmd_context.clone()).await;
                if let Err(why) = exec_res {
                    let _ = cmd_context
                        .reply(format!("Failed to execute: {}, reason: {}", cmd_name, why))
                        .await;
                };
            } else {
                let _ = cmd_context
                    .reply(format!("No command named: {}, was found", cmd_name))
                    .await
                    .map_err(|why| error!("Failed to reply: {}", why));
            }
        } else {
            error!("Unhandled interaction: {:?}", interaction);
        }
    }
}
