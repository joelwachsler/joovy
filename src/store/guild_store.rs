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
) {
    info!("Initializing new guild store receiver...");
    let mut store = match GuildStore::new(initial_ctx).await {
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

/// The current state of a single guild.
pub struct GuildStore {
    pub disconnect_handle: Option<broadcast::Sender<()>>,
    store: Box<dyn Store + Send + Sync>,
}

impl Default for GuildStore {
    fn default() -> Self {
        Self {
            disconnect_handle: Default::default(),
            store: Box::new(MemoryStore::default()),
        }
    }
}

impl GuildStore {
    pub async fn new(ctx: &CommandContext) -> Result<Self> {
        ctx.join_voice().await?;
        Ok(GuildStore::default())
    }

    pub async fn next_track_in_queue(&mut self) -> Result<Option<QueuedTrack>> {
        let queue = self.store.queue().await?;
        if queue.is_empty() {
            return Ok(None);
        }

        let current_track = self.store.current_track().await?;

        match current_track {
            CurrentTrack::Last(track) => {
                if queue.len() != track {
                    self.set_track(&CurrentTrack::Index(track + 1)).await?;
                }
            }
            CurrentTrack::Index(track) => {
                if queue.len() <= track + 1 {
                    self.set_track(&CurrentTrack::Last(track)).await?;
                } else {
                    self.set_track(&CurrentTrack::Index(track + 1)).await?;
                }
            }
            CurrentTrack::None => {
                self.store
                    .set_current_track(&CurrentTrack::Index(0))
                    .await?
            }
        }

        self.current_track().await
    }

    async fn set_track(&mut self, track: &CurrentTrack) -> Result<()> {
        self.store.set_current_track(track).await
    }

    pub async fn current_track_index(&self) -> Result<Option<usize>> {
        match self.store.current_track().await? {
            CurrentTrack::Index(index) => Ok(Some(index)),
            _ => Ok(None),
        }
    }

    pub async fn is_playing(&self) -> Result<bool> {
        let current_track = self.store.current_track().await?;
        Ok(matches!(current_track, CurrentTrack::Index(_)))
    }

    pub async fn current_track(&self) -> Result<Option<QueuedTrack>> {
        let track_index = match self.current_track_index().await? {
            Some(index) => index,
            None => return Ok(None),
        };

        let queue = self.queue().await?;
        let track = queue.get(track_index);
        Ok(track.cloned())
    }

    pub async fn update_track(&mut self, index: usize, track: &QueuedTrack) -> Result<()> {
        self.store.edit_track(index, track).await?;
        Ok(())
    }

    pub async fn queue(&self) -> Result<Vec<QueuedTrack>> {
        let res = self.store.queue().await?;
        Ok(res)
    }

    pub async fn add_to_queue_internal(&mut self, track: &QueuedTrack) -> Result<()> {
        self.store.add_track_to_queue(track).await?;
        Ok(())
    }
}

#[async_trait]
pub trait Store {
    async fn current_track(&self) -> Result<CurrentTrack>;
    async fn set_current_track(&mut self, track: &CurrentTrack) -> Result<()>;
    async fn queue(&self) -> Result<Vec<QueuedTrack>>;
    async fn add_track_to_queue(&mut self, track: &QueuedTrack) -> Result<()>;
    async fn edit_track(&mut self, index: usize, track: &QueuedTrack) -> Result<()>;
}
