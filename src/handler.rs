use serenity::model::prelude::interaction::Interaction;
use serenity::{async_trait, model::prelude::*, prelude::*};
use std::env;
use tracing::{debug, error, info, warn};

use crate::commands::{play, CommandContext, JoovyCommand};

type SendableJoovyCommand = dyn JoovyCommand + Send + Sync;

const COMMANDS: &[&SendableJoovyCommand] = &[&play::Play];

pub struct Handler;

#[async_trait]
impl EventHandler for Handler {
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

            if let Some(res) = found_cmd {
                let cmd_context = CommandContext::new(&ctx, &command);

                let _ = res
                    .execute(cmd_context)
                    .await
                    .map_err(|why| error!("Failed to execute: {}, reason: {}", cmd_name, why));
            } else {
                warn!("No command named: {}, was found", cmd_name);
            }
        } else {
            error!("Unhandled interaction: {:?}", interaction);
        }
    }
}
