use anyhow::Result;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::mpsc::{self, Receiver, Sender};
use tracing::info;

use super::guild_store::init_guild_store_receiver;
use crate::command_context::CommandContext;

pub type GuildStoreSender = Sender<GuildStoreAction>;
pub type GuildStoreReceiver = Receiver<GuildStoreAction>;

pub enum GuildStoreAction {
    AddToQueue(Arc<CommandContext>, String),
    PlayNextTrack(Arc<CommandContext>, bool),
    Disconnect(Arc<CommandContext>),
    // First u64 is from and second is to.
    Remove(Arc<CommandContext>, u64, Option<u64>),
    RemoveLast(Arc<CommandContext>),
    PrintQueue(Arc<CommandContext>),
}

impl GuildStoreAction {
    pub fn ctx(&self) -> Arc<CommandContext> {
        let ctx = match self {
            GuildStoreAction::AddToQueue(ctx, _) => ctx,
            GuildStoreAction::PlayNextTrack(ctx, _) => ctx,
            GuildStoreAction::Disconnect(ctx) => ctx,
            GuildStoreAction::Remove(ctx, _, _) => ctx,
            GuildStoreAction::RemoveLast(ctx) => ctx,
            GuildStoreAction::PrintQueue(ctx) => ctx,
        };

        ctx.clone()
    }
}

pub struct GuildStoresActionHandler {
    guild_senders: HashMap<u64, GuildStoreSender>,
}

impl GuildStoresActionHandler {
    pub fn new() -> Self {
        Self {
            guild_senders: HashMap::new(),
        }
    }

    pub async fn init(&mut self, mut receiver: GuildStoreReceiver) {
        while let Some(next_action) = receiver.recv().await {
            let ctx = next_action.ctx();
            let channel_id = match self.channel_id(&ctx).await {
                Ok(id) => id,
                Err(err) => {
                    info!("Failed to join channel: {}", err);
                    let _ = ctx
                        .send("Failed to initialize, are you joined to a voice channel?")
                        .await;
                    continue;
                }
            };

            if let Ok(store_sender) = self.get_store_sender(&ctx, &channel_id).await {
                if let GuildStoreAction::Disconnect(_) = next_action {
                    self.remove_guild_sender(&channel_id);
                }

                let _ = store_sender.send(next_action).await;
            }
        }
    }

    async fn get_store_sender(
        &mut self,
        ctx: &CommandContext,
        channel_id: &u64,
    ) -> Result<GuildStoreSender> {
        if !self.guild_senders.contains_key(channel_id) {
            let (tx, rx) = mpsc::channel(100);
            init_guild_store_receiver(rx, ctx).await;
            self.guild_senders.insert(*channel_id, tx);
        }

        Ok(self.guild_senders.get_mut(channel_id).unwrap().clone())
    }

    fn remove_guild_sender(&mut self, channel_id: &u64) {
        self.guild_senders.remove(channel_id);
    }

    async fn channel_id(&self, ctx: &CommandContext) -> Result<u64> {
        let channel = ctx.voice_channel_id().await?;
        Ok(*channel.as_u64())
    }
}
