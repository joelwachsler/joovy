use anyhow::Result;
use serenity::prelude::*;
use std::{collections::HashMap, sync::Arc};

use crate::command_context::CommandContext;

#[derive(Clone)]
pub struct QueuedTrack {
    title: String,
    url: String,
}

impl QueuedTrack {
    pub fn new(title: &str, url: &str) -> Self {
        Self {
            title: title.to_string(),
            url: url.to_string(),
        }
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub fn url(&self) -> &str {
        &self.url
    }

    pub async fn try_from_query(query: &str) -> Result<QueuedTrack> {
        let res = search::search(query).await?;
        Ok(QueuedTrack::new(res.title(), res.url()))
    }
}

pub struct GuildStore {
    current_track: Option<QueuedTrack>,
    queue: Vec<QueuedTrack>,
}

impl GuildStore {
    fn new() -> Self {
        Self {
            queue: vec![],
            current_track: None,
        }
    }

    pub fn next_track_in_queue(&mut self) -> Option<QueuedTrack> {
        let next_item = self.queue.pop();
        self.current_track = next_item;
        self.current_track.clone()
    }

    pub async fn add_to_queue(&mut self, ctx: &CommandContext, query: &str) -> Result<()> {
        let new_track = QueuedTrack::try_from_query(query).await?;
        ctx.send(format!("{} has been added to the queue", new_track.title()))
            .await?;
        self.queue.push(new_track);

        Ok(())
    }

    pub fn is_playing(&self) -> bool {
        self.current_track.is_some()
    }
}

impl TypeMapKey for GuildStores {
    type Value = Arc<GuildStores>;
}

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
