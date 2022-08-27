use anyhow::Result;
use tracing::info;

use super::{guild_action::GuildStoreReceiver, queued_track::QueuedTrack};
use crate::{
    command_context::CommandContext,
    store::guild_action::{Execute, GuildAction, HasCtx},
};

#[derive(Debug)]
enum CurrentTrack {
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
#[derive(Debug)]
pub struct GuildStore {
    current_track: CurrentTrack,
    queue: Vec<QueuedTrack>,
}

impl Default for GuildStore {
    fn default() -> Self {
        Self {
            current_track: CurrentTrack::None,
            queue: Default::default(),
        }
    }
}

impl GuildStore {
    pub async fn new(ctx: &CommandContext) -> Result<Self> {
        ctx.join_voice().await?;
        Ok(GuildStore::default())
    }

    pub fn next_track_in_queue(&mut self) -> Option<QueuedTrack> {
        if self.queue.is_empty() {
            return None;
        }

        match self.current_track {
            CurrentTrack::Last(track) => {
                if self.queue.len() != track {
                    self.current_track = CurrentTrack::Index(track + 1);
                }
            }
            CurrentTrack::Index(track) => {
                if self.queue.len() <= track + 1 {
                    self.current_track = CurrentTrack::Last(track);
                } else {
                    self.current_track = CurrentTrack::Index(track + 1);
                }
            }
            CurrentTrack::None => self.current_track = CurrentTrack::Index(0),
        }

        self.current_track()
    }

    pub fn current_track_index(&self) -> Option<usize> {
        match self.current_track {
            CurrentTrack::Index(index) => Some(index),
            _ => None,
        }
    }

    pub fn is_playing(&self) -> bool {
        matches!(self.current_track, CurrentTrack::Index(_))
    }

    pub fn current_track(&self) -> Option<QueuedTrack> {
        self.current_track_index()
            .and_then(|i| self.queue.get(i))
            .cloned()
    }

    pub fn edit_track(&mut self, index: usize) -> Option<&mut QueuedTrack> {
        self.queue.get_mut(index)
    }

    pub fn queue(&self) -> Vec<&QueuedTrack> {
        self.queue.iter().collect()
    }

    pub fn add_to_queue_internal(&mut self, track: QueuedTrack) {
        self.queue.push(track);
    }
}
