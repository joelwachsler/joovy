use anyhow::Result;
use serenity::prelude::{RwLock, TypeMapKey};
use std::{collections::HashMap, sync::Arc};

use super::guild_store::GuildStore;
use crate::command_context::CommandContext;

/// The current state of all connected guilds.
pub struct GuildStores {
    guilds: RwLock<HashMap<u64, Arc<GuildStore>>>,
}

impl GuildStores {
    pub fn new() -> Self {
        Self {
            guilds: RwLock::new(HashMap::new()),
        }
    }

    pub async fn get_or_create_store(&self, ctx: &CommandContext) -> Result<Arc<GuildStore>> {
        let channel_id = ctx.text_channel_id().await;
        let channel_id = channel_id.as_u64();

        let mut guilds = self.guilds.write().await;
        if !guilds.contains_key(channel_id) {
            guilds.insert(*channel_id, Arc::new(GuildStore::new()));
            ctx.join_voice().await?;
        }

        Ok(guilds.get(channel_id).unwrap().clone())
    }
}

impl TypeMapKey for GuildStores {
    type Value = Arc<GuildStores>;
}
