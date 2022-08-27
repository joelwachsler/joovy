use serenity::{async_trait, prelude::TypeMapKey};
use std::sync::Arc;
use tokio::sync::mpsc::{self, Sender};

use super::guild_store_action::{GuildStoreAction, GuildStoreSender, GuildStoresActionHandler};
use crate::command_context::CommandContext;

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
