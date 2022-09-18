use sea_orm::DatabaseConnection;
use serenity::{async_trait, prelude::TypeMapKey};
use std::sync::Arc;
use tokio::sync::mpsc::{self, Sender};

use super::guild_action::{GuildAction, GuildActionHandler, GuildStoreSender};
use crate::command_context::CommandContext;

pub struct GuildStores {
    sender: GuildStoreSender,
}

impl GuildStores {
    fn new(sender: GuildStoreSender) -> Self {
        Self { sender }
    }

    pub fn init_store(conn: DatabaseConnection) -> Arc<GuildStores> {
        let (tx, rx) = mpsc::channel::<GuildAction>(100);
        let store = Arc::new(GuildStores::new(tx));
        tokio::spawn(async move { GuildActionHandler::new(conn).init_receiver(rx).await });

        store
    }

    pub fn sender(&self) -> &Sender<GuildAction> {
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
