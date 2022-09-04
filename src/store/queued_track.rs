use anyhow::{bail, Result};

use crate::command_context::CommandContext;

use super::guild_store::StoreType;

#[derive(Debug, Clone, Eq, PartialEq, Default)]
pub struct QueuedTrack {
    pub title: String,
    pub url: String,
    pub author: u64,
    pub username: String,
    pub duration: i32,
    pub skip: bool,
}

impl QueuedTrack {
    pub fn url(&self) -> &str {
        &self.url
    }

    pub fn author(&self) -> u64 {
        self.author
    }

    pub fn username(&self) -> &str {
        &self.username
    }

    pub fn duration(&self) -> &i32 {
        &self.duration
    }

    pub async fn try_from_query(
        ctx: &CommandContext,
        query: &str,
        store: &StoreType,
    ) -> Result<QueuedTrack> {
        if query.contains("list=") {
            bail!("Playlists are not currently supported!")
        }

        let user = &ctx.interaction().user;
        if let Some(track) = store.find_track_query_result(query).await? {
            Ok(QueuedTrack {
                title: track.title,
                url: track.url,
                author: *user.id.as_u64(),
                username: user.name.clone(),
                duration: track.duration,
                skip: false,
            })
        } else {
            let res = search::search(query).await?;

            let queued_track = QueuedTrack {
                title: res.title().into(),
                url: res.url().into(),
                duration: res.duration() as i32,
                author: *user.id.as_u64(),
                username: user.name.clone(),
                skip: false,
            };

            store.add_track_query_result(query, &queued_track).await?;
            Ok(queued_track)
        }
    }

    /// The name to display if printed in the discord chat. Unlike the title this name
    /// will print various info such as the song duration, url and the author who
    /// requested the song.
    pub fn name(&self) -> String {
        let title = &self.title;
        let url = &self.url;
        let author = &self.author;
        let duration = self.min_sec_duration();

        format!("[{title} ({duration})]({url}) [<@{author}>]")
    }

    fn min_sec_duration(&self) -> String {
        let mins = self.duration / 60;
        let secs = self.duration % 60;
        let secs = if secs < 10 {
            format!("0{secs}")
        } else {
            format!("{secs}")
        };

        format!("{mins}:{secs}")
    }

    pub fn skip_track(&mut self) {
        self.skip = true;
    }

    pub fn should_skip(&self) -> bool {
        self.skip
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    #[cfg(test)]
    pub fn create_for_test(title: &str) -> QueuedTrack {
        QueuedTrack {
            title: title.into(),
            url: "url".into(),
            author: 1,
            username: "username".into(),
            duration: 1,
            skip: false,
        }
    }

    #[cfg(test)]
    pub fn create_for_test_two(title: &str, url: &str) -> QueuedTrack {
        QueuedTrack {
            title: title.into(),
            url: url.into(),
            author: 1,
            username: "username".into(),
            duration: 1,
            skip: false,
        }
    }
}
