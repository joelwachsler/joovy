use anyhow::Result;
use enum_dispatch::enum_dispatch;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::mpsc::{self, Receiver, Sender};
use tracing::info;

use super::guild_store::init_guild_store_receiver;
use crate::command_context::CommandContext;
use crate::store::guild_store::add_track_to_queue::AddToQueue;
use crate::store::guild_store::disconnect::Disconnect;
use crate::store::guild_store::play_next_track::PlayNextTrack;
use crate::store::guild_store::print_queue::PrintQueue;
use crate::store::guild_store::remove::Remove;
use crate::store::guild_store::remove_last::RemoveLast;

pub type GuildStoreSender = Sender<GuildStoreAction>;
pub type GuildStoreReceiver = Receiver<GuildStoreAction>;

#[enum_dispatch]
pub enum GuildStoreAction {
    AddToQueue,
    PlayNextTrack,
    Disconnect,
    Remove,
    RemoveLast,
    PrintQueue,
}

#[enum_dispatch(GuildStoreAction)]
pub trait HasCtx {
    fn ctx_base(&self) -> Option<Arc<CommandContext>>;

    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx_base().expect("Context is not defined")
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
