use anyhow::Result;

use crate::command_context::CommandContext;

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct QueuedTrack {
    title: String,
    url: String,
    author: u64,
    duration: u32,
    skip: bool,
}

impl QueuedTrack {
    pub fn url(&self) -> &str {
        &self.url
    }

    pub async fn try_from_query(ctx: &CommandContext, query: &str) -> Result<QueuedTrack> {
        let res = search::search(query).await?;
        Ok(QueuedTrack {
            title: res.title().into(),
            url: res.url().into(),
            duration: res.duration(),
            author: *ctx.interaction().user.id.as_u64(),
            skip: false,
        })
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

    #[cfg(test)]
    pub fn title(&self) -> &str {
        &self.title
    }

    #[cfg(test)]
    pub fn create_for_test(title: &str) -> QueuedTrack {
        QueuedTrack {
            title: title.into(),
            url: "url".into(),
            author: 1,
            duration: 1,
            skip: false,
        }
    }
}
