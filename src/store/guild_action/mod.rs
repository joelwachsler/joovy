use anyhow::Result;
use enum_dispatch::enum_dispatch;
use sea_orm::DatabaseConnection;
use serenity::async_trait;
use std::{collections::HashMap, sync::Arc};
use strum::AsRefStr;
use tokio::sync::mpsc::{self, Receiver, Sender};
use tracing::info;

use super::guild_store::{init_guild_store_receiver, GuildStore};
use crate::command_context::CommandContext;
use crate::store::guild_action::add_track_to_queue::AddToQueue;
use crate::store::guild_action::disconnect::Disconnect;
use crate::store::guild_action::play_next_track::PlayNextTrack;
use crate::store::guild_action::print_queue::PrintQueue;
use crate::store::guild_action::remove::Remove;
use crate::store::guild_action::remove_last::RemoveLast;

pub mod add_track_to_queue;
pub mod disconnect;
pub mod play_next_track;
pub mod print_queue;
pub mod remove;
pub mod remove_last;

pub type GuildStoreSender = Sender<GuildAction>;
pub type GuildStoreReceiver = Receiver<GuildAction>;

#[enum_dispatch]
#[derive(AsRefStr)]
pub enum GuildAction {
    AddToQueue,
    PlayNextTrack,
    Disconnect,
    Remove,
    RemoveLast,
    PrintQueue,
}

#[enum_dispatch(GuildAction)]
pub trait HasCtx {
    fn ctx(&self) -> Arc<CommandContext>;
}

#[async_trait]
#[enum_dispatch(GuildAction)]
pub trait Execute {
    async fn execute(&self, store: &mut GuildStore) -> Result<()>;
}

pub struct GuildActionHandler {
    guild_senders: HashMap<u64, GuildStoreSender>,
    conn: DatabaseConnection,
}

impl GuildActionHandler {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self {
            guild_senders: HashMap::new(),
            conn,
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

            if let Ok(store_sender) = self.store_sender(&ctx, &channel_id).await {
                if let GuildAction::Disconnect(_) = next_action {
                    self.remove_guild_sender(&channel_id);
                }

                let _ = store_sender.send(next_action).await;
            }
        }
    }

    async fn store_sender(
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
