use std::{collections::HashMap, sync::Arc};

use serenity::prelude::{RwLock, TypeMapKey};

use super::guild_store::GuildStore;

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

    pub async fn get_or_create_store(&self, channel_id: u64) -> Arc<GuildStore> {
        let mut guilds = self.guilds.write().await;
        guilds
            .entry(channel_id)
            .or_insert_with(|| Arc::new(GuildStore::new()));

        guilds.get(&channel_id).unwrap().clone()
    }
}

impl TypeMapKey for GuildStores {
    type Value = Arc<GuildStores>;
}
