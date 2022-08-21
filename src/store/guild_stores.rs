use anyhow::Result;
use serenity::{async_trait, prelude::TypeMapKey};
use songbird::{Event, TrackEvent};
use songbird::{EventContext, EventHandler as SongbirdEventHandler};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::mpsc::{self, Receiver, Sender};
use tracing::info;

use super::guild_store::GuildStore;
use crate::command_context::{voice::IntoInput, CommandContext};

type GuildStoreSender = Sender<GuildStoreAction>;
type GuildStoreReceiver = Receiver<GuildStoreAction>;

/// The current state of all connected guilds.
pub struct GuildStores {
    sender: GuildStoreSender,
}

impl GuildStores {
    fn new(sender: GuildStoreSender) -> Self {
        Self { sender }
    }

    pub fn init_store() -> Arc<GuildStores> {
        let (tx, rx) = mpsc::channel::<GuildStoreAction>(100);
        let store = Arc::new(GuildStores::new(tx));
        tokio::spawn(async move { GuildStoresActionHandler::new().init(rx).await });

        store
    }

    pub fn sender(&self) -> &Sender<GuildStoreAction> {
        &self.sender
    }
}

struct GuildStoresActionHandler {
    guilds: HashMap<u64, GuildStore>,
}

impl GuildStoresActionHandler {
    fn new() -> Self {
        Self {
            guilds: HashMap::new(),
        }
    }

    async fn init(&mut self, mut receiver: GuildStoreReceiver) {
        while let Some(next_action) = receiver.recv().await {
            match next_action {
                GuildStoreAction::AddToQueue(ctx, query) => {
                    if let Err(why) = self.add_to_queue(ctx.clone(), &query).await {
                        let _ = ctx.send(format!("Error: {}", why)).await;
                    }
                }
                GuildStoreAction::PlayNextTrack(ctx) => {
                    if let Err(why) = self.play_next_track(ctx.clone()).await {
                        let _ = ctx.send(format!("Error: {}", why)).await;
                    }
                }
                GuildStoreAction::RemoveCurrentTrack(ctx) => {
                    if let Err(why) = self.remove_current_track(ctx.clone()).await {
                        let _ = ctx.send(format!("Error: {}", why)).await;
                    }
                }
            }
        }
    }

    async fn play_next_track(&mut self, ctx: Arc<CommandContext>) -> Result<()> {
        let store = self.get_or_create_store(&ctx).await?;
        if store.is_playing() {
            info!("Already playing a track, skipping.");
            return Ok(());
        }

        if let Some(next_track) = store.next_track_in_queue() {
            let handler_lock = ctx.songbird_call_lock().await?;

            let mut handler = handler_lock.lock().await;
            let next_input = next_track.to_input().await?;
            let handle = handler.play_only_source(next_input);
            let _ = handle.add_event(
                Event::Track(TrackEvent::End),
                SongEndNotifier::new(ctx.clone()),
            );

            ctx.send(format!("Now playing {}", next_track.title()))
                .await?;
        } else {
            let _ = ctx.send("End of playlist").await;
        }

        Ok(())
    }

    async fn remove_current_track(&mut self, ctx: Arc<CommandContext>) -> Result<()> {
        let store = self.get_or_create_store(&ctx).await?;
        store.remove_current_track();

        Ok(())
    }

    async fn add_to_queue(&mut self, ctx: Arc<CommandContext>, query: &str) -> Result<()> {
        let store = self.get_or_create_store(&ctx).await?;
        let _ = store.add_to_queue(&ctx, query).await?;

        if !store.is_playing() {
            ctx.send_action(GuildStoreAction::PlayNextTrack(ctx.clone()))
                .await?;
        }

        Ok(())
    }

    async fn get_or_create_store(&mut self, ctx: &CommandContext) -> Result<&mut GuildStore> {
        let channel_id = ctx.text_channel_id().await;
        let channel_id = channel_id.as_u64();

        if !self.guilds.contains_key(channel_id) {
            self.guilds.insert(*channel_id, GuildStore::new(ctx).await?);
        }

        Ok(self.guilds.get_mut(channel_id).unwrap())
    }
}

pub enum GuildStoreAction {
    AddToQueue(Arc<CommandContext>, String),
    PlayNextTrack(Arc<CommandContext>),
    RemoveCurrentTrack(Arc<CommandContext>),
}

impl TypeMapKey for GuildStores {
    type Value = Arc<GuildStores>;
}

#[async_trait]
pub trait HasGuildStores {
    async fn guild_stores(&self) -> Arc<GuildStores>;
}

#[async_trait]
impl HasGuildStores for CommandContext {
    async fn guild_stores(&self) -> Arc<GuildStores> {
        let data_read = self.ctx().data.read().await;
        data_read.get::<GuildStores>().unwrap().clone()
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
impl SongbirdEventHandler for SongEndNotifier {
    async fn act(&self, _: &EventContext<'_>) -> Option<Event> {
        let _ = self
            .ctx
            .send_action(GuildStoreAction::RemoveCurrentTrack(self.ctx.clone()))
            .await;
        let _ = self
            .ctx
            .send_action(GuildStoreAction::PlayNextTrack(self.ctx.clone()))
            .await;

        None
    }
}
