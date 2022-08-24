use anyhow::Result;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::mpsc::{Receiver, Sender};

use super::guild_store::GuildStore;
use crate::command_context::CommandContext;

pub type GuildStoreSender = Sender<GuildStoreAction>;
pub type GuildStoreReceiver = Receiver<GuildStoreAction>;

mod add_track_to_queue;
mod disconnect;
mod play_next_track;
mod print_queue;
mod remove;

pub enum GuildStoreAction {
    AddToQueue(Arc<CommandContext>, String),
    PlayNextTrack(Arc<CommandContext>, bool),
    Disconnect(Arc<CommandContext>),
    // First u64 is from and second is to.
    Remove(Arc<CommandContext>, u64, Option<u64>),
    PrintQueue(Arc<CommandContext>),
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
            // the error handling could use some love :)
            match next_action {
                GuildStoreAction::AddToQueue(ctx, query) => {
                    if let Err(why) = self.add_to_queue(ctx.clone(), &query).await {
                        let _ = ctx.send(format!("AddToQueue error: {}", why)).await;
                    }
                }
                GuildStoreAction::PlayNextTrack(ctx, force) => {
                    if let Err(why) = self.play_next_track(ctx.clone(), force).await {
                        let _ = ctx.send(format!("PlayNextTrack error: {}", why)).await;
                    }
                }
                GuildStoreAction::Disconnect(ctx) => {
                    if let Err(why) = self.disconnect(ctx.clone()).await {
                        let _ = ctx.send(format!("Disconnect error: {}", why)).await;
                    }
                }
                GuildStoreAction::Remove(ctx, from, to) => {
                    if let Err(why) = self.remove(ctx.clone(), from, to).await {
                        let _ = ctx.send(format!("Remove error: {}", why)).await;
                    }
                }
                GuildStoreAction::PrintQueue(ctx) => {
                    if let Err(why) = self.print_queue(ctx.clone()).await {
                        let _ = ctx.send(format!("Print queue error: {}", why)).await;
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

    async fn remove_store(&mut self, ctx: &CommandContext) {
        let channel_id = ctx.text_channel_id().await;
        let channel_id = channel_id.as_u64();
        self.guilds.remove(channel_id);
    }
}
