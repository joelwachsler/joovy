use std::sync::Arc;

use anyhow::Result;
use serenity::{async_trait, utils::Color};
use typed_builder::TypedBuilder;

use super::GuildStore;
use crate::{
    command_context::CommandContext,
    store::{
        guild_action::{Execute, HasCtx},
        queued_track::QueuedTrack,
    },
};

#[async_trait]
impl Execute for PrintQueue {
    async fn execute(&self, store: &mut GuildStore) -> Result<()> {
        let PrintQueue { ctx } = self;

        let queue = store.queue();

        let current_track_index = store.current_track_index().unwrap_or_default();
        let output = match print_queue(queue, current_track_index) {
            Some(output) => output,
            None => {
                ctx.send("The queue is empty 👀").await?;
                return Ok(());
            }
        };

        ctx.reply_embed(|embed| {
            embed
                .color(Color::from_rgb(255, 184, 31))
                .title("Queue")
                .description(output.join("\n"))
        })
        .await?;

        Ok(())
    }
}

fn print_queue(queue: Vec<&QueuedTrack>, current_track_index: usize) -> Option<Vec<String>> {
    if queue.is_empty() {
        return None;
    }

    let output =
        queue
            .iter()
            .enumerate()
            .skip(current_track_index)
            .fold(vec![], |mut acc, (i, curr)| {
                let track_name = curr.name();
                if curr.should_skip() {
                    acc.push(format!("`{i}` ~~{track_name}~~"));
                } else if i == current_track_index {
                    acc.push("⬐ current track".into());
                    acc.push(format!("`{i}` {track_name}"));
                    acc.push("⬑ current track".into());
                } else {
                    acc.push(format!("`{i}` {track_name}"));
                }
                acc
            });

    Some(output)
}

#[derive(TypedBuilder)]
pub struct PrintQueue {
    ctx: Arc<CommandContext>,
}

impl HasCtx for PrintQueue {
    fn ctx(&self) -> Arc<CommandContext> {
        self.ctx.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_queue() {
        assert_eq!(print_queue(vec![], 0), None);
    }

    #[test]
    fn single_selected_item_in_queue() {
        let track = QueuedTrack::default();
        let queue = vec![&track];
        assert_eq!(
            print_queue(queue, 0).unwrap(),
            vec![
                "⬐ current track",
                "`0` [ (0:00)]() [<@0>]",
                "⬑ current track"
            ]
        );
    }

    #[test]
    fn multiple_items_in_queue() {
        let track = QueuedTrack::default();
        let queue = vec![&track, &track];
        assert_eq!(
            print_queue(queue, 0).unwrap(),
            vec![
                "⬐ current track",
                "`0` [ (0:00)]() [<@0>]",
                "⬑ current track",
                "`1` [ (0:00)]() [<@0>]",
            ]
        );
    }

    #[test]
    fn after_first_item_in_queue() {
        let track = QueuedTrack::default();
        let queue = vec![&track, &track];
        assert_eq!(
            print_queue(queue, 1).unwrap(),
            vec![
                "⬐ current track",
                "`1` [ (0:00)]() [<@0>]",
                "⬑ current track",
            ]
        );
    }

    #[test]
    fn first_skipped_two_tracks_left() {
        let track = QueuedTrack::default();
        let queue = vec![&track, &track, &track];
        assert_eq!(
            print_queue(queue, 1).unwrap(),
            vec![
                "⬐ current track",
                "`1` [ (0:00)]() [<@0>]",
                "⬑ current track",
                "`2` [ (0:00)]() [<@0>]",
            ]
        );
    }
}
