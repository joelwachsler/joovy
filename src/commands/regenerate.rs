use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::prelude::command::CommandOptionType::Boolean;
use serenity::model::prelude::command::CommandOptionType::Integer;

use crate::command_context::CommandContext;
use crate::store::guild_action::regenerate_queue::RegenerateQueue;

use super::CommandDataOptionUtil;
use super::{JoovyCommand, JoovyCommands};

const SHUFFLE: &str = "shuffle";
const DEDUP: &str = "dedup";
const GO_BACK: &str = "go_back";
const GO_BACK_DEFAULT: u64 = 1;
const MAX_TRACKS: &str = "max_tracks";
const MAX_TRACKS_DEFAULT: u64 = 25;

#[derive(Default, Debug)]
pub struct Regenerate;

#[async_trait]
impl JoovyCommand for Regenerate {
    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name(JoovyCommands::Regenerate(Regenerate).as_ref())
            .description("Create a new playlist by sampling previous playlists")
            .create_option(|option| {
                option
                    .name(SHUFFLE)
                    .kind(Boolean)
                    .description("Should we shuffle the playlist? (default: false)")
                    .required(false)
            })
            .create_option(|option| {
                option
                    .name(DEDUP)
                    .kind(Boolean)
                    .description("Should duplicates be removed? (default: true)")
                    .required(false)
            })
            .create_option(|option| {
                option
                    .name(GO_BACK)
                    .kind(Integer)
                    .description(
                        format!("The number of playlists to go back and take tracks from (default: {GO_BACK_DEFAULT})"),
                    )
                    .min_int_value(0)
                    .max_int_value(100)
                    .required(false)
            })
            .create_option(|option| {
                option
                    .name(MAX_TRACKS)
                    .kind(Integer)
                    .description(
                        format!("The maximum number of tracks to add to the new playlist (default: {MAX_TRACKS_DEFAULT})"),
                    )
                    .min_int_value(0)
                    .max_int_value(100)
                    .required(false)
            })
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let options = &ctx.interaction().data.options;

        ctx.send_action(
            RegenerateQueue::builder()
                .ctx(ctx.clone())
                .shuffle(options.get_bool(SHUFFLE).unwrap_or_default())
                .dedup(options.get_bool(DEDUP).unwrap_or(true))
                .go_back(options.get_u64(GO_BACK).unwrap_or(GO_BACK_DEFAULT))
                .max_tracks(options.get_u64(MAX_TRACKS).unwrap_or(MAX_TRACKS_DEFAULT) as usize)
                .build(),
        )
        .await?;

        Ok(())
    }
}
