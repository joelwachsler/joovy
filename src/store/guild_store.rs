use anyhow::Result;
use serenity::async_trait;
use tokio::sync::broadcast;
use tracing::info;

use super::{
    guild_action::GuildStoreReceiver, memory_store::MemoryStore, queued_track::QueuedTrack,
};
use crate::{
    command_context::CommandContext,
    store::guild_action::{Execute, GuildAction, HasCtx},
};

#[derive(Debug, Clone, Copy)]
pub enum CurrentTrack {
    // the usize is the previous last index
    Last(usize),
    Index(usize),
    None,
}

pub async fn init_guild_store_receiver(
    mut receiver: GuildStoreReceiver,
    initial_ctx: &CommandContext,
    store: StoreType,
) {
    info!("Initializing new guild store receiver...");
    let mut store = match GuildStore::new(initial_ctx, store).await {
        Ok(store) => store,
        Err(err) => {
            let _ = initial_ctx
                .send(format!("Failed to initialize: {}", err))
                .await;
            return;
        }
    };

    tokio::spawn(async move {
        while let Some(next_action) = receiver.recv().await {
            if let Err(why) = next_action.execute(&mut store).await {
                let _ = next_action
                    .ctx()
                    .send(format!("{} error: {}", next_action.as_ref(), why))
                    .await;
            }

            if let GuildAction::Disconnect(_) = next_action {
                break;
            }
        }
    });
}

pub type StoreType = Box<dyn Store + Send + Sync>;

/// The current state of a single guild.
pub struct GuildStore {
    pub disconnect_handle: Option<broadcast::Sender<()>>,
    current_track: CurrentTrack,
    store: StoreType,
}

impl Default for GuildStore {
    fn default() -> Self {
        Self {
            disconnect_handle: Default::default(),
            current_track: CurrentTrack::None,
            store: Box::new(MemoryStore::default()),
        }
    }
}

impl GuildStore {
    pub async fn new(ctx: &CommandContext, store: StoreType) -> Result<Self> {
        ctx.join_voice().await?;
        Ok(GuildStore {
            disconnect_handle: Default::default(),
            current_track: CurrentTrack::None,
            store,
        })
    }

    pub fn store(&self) -> &StoreType {
        &self.store
    }

    pub async fn next_track_in_queue(&mut self) -> Result<Option<QueuedTrack>> {
        let queue = self.store.queue().await?;
        if queue.is_empty() {
            return Ok(None);
        }

        match self.current_track {
            CurrentTrack::Last(track) => {
                if queue.len() != track {
                    self.current_track = CurrentTrack::Index(track + 1);
                }
            }
            CurrentTrack::Index(track) => {
                if queue.len() <= track + 1 {
                    self.current_track = CurrentTrack::Last(track);
                } else {
                    self.current_track = CurrentTrack::Index(track + 1);
                }
            }
            CurrentTrack::None => {
                self.current_track = CurrentTrack::Index(0);
            }
        }

        self.current_track().await
    }

    pub fn current_track_index(&self) -> Option<usize> {
        match self.current_track {
            CurrentTrack::Index(index) => Some(index),
            _ => None,
        }
    }

    pub async fn is_playing(&self) -> Result<bool> {
        Ok(matches!(self.current_track, CurrentTrack::Index(_)))
    }

    pub async fn current_track(&self) -> Result<Option<QueuedTrack>> {
        let track_index = match self.current_track_index() {
            Some(index) => index,
            None => return Ok(None),
        };

        let queue = self.queue().await?;
        let track = queue.get(track_index);
        Ok(track.cloned())
    }

    pub async fn skip_track(&mut self, index: i32) -> Result<()> {
        self.store.skip_track(index).await
    }

    pub async fn queue(&self) -> Result<Vec<QueuedTrack>> {
        self.store.queue().await
    }

    pub async fn add_to_queue_internal(&mut self, track: &QueuedTrack) -> Result<()> {
        self.store.add_track_to_queue(track).await
    }
}

pub struct TrackQueryResult {
    pub title: String,
    pub url: String,
    pub duration: i32,
}

#[async_trait]
pub trait Store {
    async fn queue(&self) -> Result<Vec<QueuedTrack>>;
    async fn add_track_to_queue(&mut self, track: &QueuedTrack) -> Result<()>;
    async fn skip_track(&mut self, index: i32) -> Result<()>;
    async fn find_track_query_result(&self, query: &str) -> Result<Option<TrackQueryResult>>;
    async fn add_track_query_result(&self, query: &str, track: &QueuedTrack) -> Result<()>;
}
