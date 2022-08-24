use anyhow::Result;

use super::queued_track::QueuedTrack;
use crate::command_context::CommandContext;

#[derive(Debug)]
enum CurrentTrack {
    Last,
    Index(usize),
    None,
}

/// The current state of a single guild.
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
            CurrentTrack::Last => {}
            CurrentTrack::Index(track) => {
                if self.queue.len() <= track {
                    self.current_track = CurrentTrack::Last;
                } else {
                    self.current_track = CurrentTrack::Index(track + 1);
                }
            }
            CurrentTrack::None => self.current_track = CurrentTrack::Index(0),
        }

        self.current_track()
    }

    pub async fn add_to_queue(&mut self, ctx: &CommandContext, query: &str) -> Result<()> {
        let new_track = QueuedTrack::try_from_query(ctx, query).await?;
        ctx.send(format!("{} has been added to the queue", new_track.name()))
            .await?;

        self.add_to_queue_internal(new_track);

        Ok(())
    }

    fn add_to_queue_internal(&mut self, track: QueuedTrack) {
        if let CurrentTrack::Last = self.current_track {
            self.current_track = CurrentTrack::Index(self.queue.len() - 1);
        }

        self.queue.push(track);
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_queue() {
        let mut store = GuildStore::default();
        assert_eq!(store.next_track_in_queue(), None);
    }

    #[test]
    fn single_item() {
        let mut store = GuildStore::default();
        store.add_to_queue_internal(QueuedTrack::create_for_test("foo"));
        assert_eq!(store.next_track_in_queue().unwrap().title(), "foo");
    }

    #[test]
    fn multiple_items() {
        let mut store = GuildStore::default();
        store.add_to_queue_internal(QueuedTrack::create_for_test("foo"));
        store.add_to_queue_internal(QueuedTrack::create_for_test("bar"));
        assert_eq!(store.next_track_in_queue().unwrap().title(), "foo");
        assert_eq!(store.next_track_in_queue().unwrap().title(), "bar");
    }

    #[test]
    fn index_handling() {
        let mut store = GuildStore::default();
        assert_eq!(store.next_track_in_queue(), None);
        store.add_to_queue_internal(QueuedTrack::create_for_test("foo"));
        assert_eq!(store.next_track_in_queue().unwrap().title(), "foo");
        assert_eq!(store.next_track_in_queue(), None);
        assert_eq!(store.next_track_in_queue(), None);
        store.add_to_queue_internal(QueuedTrack::create_for_test("bar"));
        assert_eq!(store.next_track_in_queue().unwrap().title(), "bar");
    }
}
