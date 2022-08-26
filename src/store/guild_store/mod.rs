mod add_track_to_queue;
mod disconnect;
mod play_next_track;
mod print_queue;
mod remove;
mod remove_last;

use anyhow::Result;
use tracing::{error, info};

use super::{guild_store_action::GuildStoreReceiver, queued_track::QueuedTrack};
use crate::{command_context::CommandContext, store::guild_store_action::GuildStoreAction};

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
            error!("Failed to init store: {}...", err);
            let _ = initial_ctx
                .send("Failed to initialize, are you in a voice channel?")
                .await;
            return;
        }
    };

    tokio::spawn(async move {
        while let Some(next_action) = receiver.recv().await {
            let ctx = next_action.ctx();

            match next_action {
                GuildStoreAction::AddToQueue(_, query) => {
                    if let Err(why) = store.add_to_queue(ctx.clone(), &query).await {
                        let _ = ctx.send(format!("AddToQueue error: {}", why)).await;
                    }
                }
                GuildStoreAction::PlayNextTrack(_, force) => {
                    if let Err(why) = store.play_next_track(ctx.clone(), force).await {
                        let _ = ctx.send(format!("PlayNextTrack error: {}", why)).await;
                    }
                }
                GuildStoreAction::Disconnect(_) => {
                    if let Err(why) = store.disconnect(&ctx).await {
                        let _ = ctx.send(format!("Disconnect error: {}", why)).await;
                    }
                    break;
                }
                GuildStoreAction::Remove(_, from, to) => {
                    if let Err(why) = store.remove(&ctx, from, to).await {
                        let _ = ctx.send(format!("Remove error: {}", why)).await;
                    }
                }
                GuildStoreAction::RemoveLast(_) => {
                    if let Err(why) = store.remove_last(&ctx).await {
                        let _ = ctx.send(format!("RemoveLast error: {}", why)).await;
                    }
                }
                GuildStoreAction::PrintQueue(_) => {
                    if let Err(why) = store.print_queue(&ctx).await {
                        let _ = ctx.send(format!("Print queue error: {}", why)).await;
                    }
                }
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
}
