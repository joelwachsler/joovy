use std::sync::Arc;

use anyhow::Result;
use serenity::async_trait;
use serenity::builder::CreateApplicationCommand;
use serenity::model::prelude::command;
use songbird::{input::Input, Event, EventContext, EventHandler, TrackEvent};

use crate::{
    command_context::CommandContext,
    store::{guild_store::HasGuildStore, queued_track::QueuedTrack},
};

use super::JoovyCommand;

#[derive(Default)]
pub struct Play;

#[async_trait]
impl JoovyCommand for Play {
    fn name(&self) -> &str {
        "play"
    }

    fn create_application_command<'a>(
        &self,
        command: &'a mut CreateApplicationCommand,
    ) -> &'a mut CreateApplicationCommand {
        command
            .name("play")
            .description("Tries to add the provided query or url to the queue")
            .create_option(|option| {
                option
                    .name("query")
                    .description("A query or url to try to add to the queue")
                    .kind(command::CommandOptionType::String)
                    .required(true)
            })
    }

    async fn execute(&self, ctx: Arc<CommandContext>) -> Result<()> {
        let store = ctx.guild_store().await;
        ctx.join_voice().await?;

        let manager = ctx.songbird().await;
        let handler_lock = match manager.get(ctx.interaction().guild_id.unwrap()) {
            Some(lock) => lock,
            None => return Ok(()),
        };

        let mut handler = handler_lock.lock().await;

        let query = ctx.value();
        store.add_to_queue(&ctx, &query).await?;
        // let search_result = search::search(&query).await?;

        if !store.is_playing().await {
            if let Some(next_track) = store.next_track_in_queue().await {
                let next_track_as_input = next_track.to_input().await?;
                let handle = handler.play_source(next_track_as_input);
                let _ = handle.add_event(
                    Event::Track(TrackEvent::End),
                    SongEndNotifier::new(ctx.clone()),
                );

                ctx.send(format!("Now playing {}", next_track.title()))
                    .await?;
            }
        }

        Ok(())
    }
}

#[async_trait]
trait IntoInput {
    async fn to_input(&self) -> Result<Input>;
}

#[async_trait]
impl IntoInput for QueuedTrack {
    async fn to_input(&self) -> Result<Input> {
        let res = songbird::ytdl(self.url()).await?;
        Ok(res)
    }
}

struct SongEndNotifier {
    ctx: Arc<CommandContext>,
}

impl SongEndNotifier {
    fn new(ctx: Arc<CommandContext>) -> Self {
        Self { ctx }
    }
}

#[async_trait]
impl EventHandler for SongEndNotifier {
    async fn act(&self, ctx: &EventContext<'_>) -> Option<Event> {
        if let EventContext::Track(track_list) = ctx {
            let _ = self
                .ctx
                .send(format!("Song has ended, track list: {:#?}", track_list))
                .await;
        }

        None
    }
}
