use anyhow::Result;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::mpsc::{Receiver, Sender};

use super::guild_store::GuildStore;
use crate::command_context::CommandContext;

pub type GuildStoreSender = Sender<GuildStoreAction>;
pub type GuildStoreReceiver = Receiver<GuildStoreAction>;

mod add_track_to_queue;
mod play_next_track;
mod remove_current_track;

pub enum GuildStoreAction {
    AddToQueue(Arc<CommandContext>, String),
    PlayNextTrack(Arc<CommandContext>),
    RemoveCurrentTrack(Arc<CommandContext>),
}

pub struct GuildStoresActionHandler {
    guilds: HashMap<u64, GuildStore>,
}

impl GuildStoresActionHandler {
    pub fn new() -> Self {
        Self {
            guilds: HashMap::new(),
        }
    }

    pub async fn init(&mut self, mut receiver: GuildStoreReceiver) {
        while let Some(next_action) = receiver.recv().await {
            match next_action {
                GuildStoreAction::AddToQueue(ctx, query) => {
                    if let Err(why) = self.add_to_queue(ctx.clone(), &query).await {
                        let _ = ctx.send(format!("AddToQueueError: {}", why)).await;
                    }
                }
                GuildStoreAction::PlayNextTrack(ctx) => {
                    if let Err(why) = self.play_next_track(ctx.clone()).await {
                        let _ = ctx.send(format!("PlayNextTrackError: {}", why)).await;
                    }
                }
                GuildStoreAction::RemoveCurrentTrack(ctx) => {
                    if let Err(why) = self.remove_current_track(ctx.clone()).await {
                        let _ = ctx.send(format!("RemoveCurrentTrackError: {}", why)).await;
                    }
                }
            }
        }
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
