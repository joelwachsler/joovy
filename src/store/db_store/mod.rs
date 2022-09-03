mod author;
mod playlist;
mod track;
mod track_query_result;

use anyhow::Result;
use chrono::Utc;
use sea_orm::{prelude::Uuid, ActiveModelTrait, DatabaseConnection, ModelTrait, Set};
use serenity::{async_trait, futures::future::try_join_all};

use self::{playlist::create_playlist, track::ToQueuedTrack};

use super::{guild_store::Store, queued_track::QueuedTrack};

pub struct DbStore {
    conn: DatabaseConnection,
    index: i32,
    playlist: Uuid,
}

impl DbStore {
    pub async fn create(conn: &DatabaseConnection, channel_id: &u64) -> Result<Self> {
        let playlist = create_playlist(conn, channel_id).await?;

        Ok(Self {
            conn: conn.clone(),
            index: 0,
            playlist: playlist.id,
        })
    }

    fn conn(&self) -> &DatabaseConnection {
        &self.conn
    }
}

#[async_trait]
impl Store for DbStore {
    async fn queue(&self) -> Result<Vec<QueuedTrack>> {
        let playlist = self.find_playlist(&self.playlist).await?.unwrap();
        let tracks = playlist
            .find_related(entity::track::Entity)
            .all(self.conn())
            .await?;

        let tracks_as_queued_tracks = tracks
            .into_iter()
            .map(|track| track.into_to_queued_track(self.conn()));

        Ok(try_join_all(tracks_as_queued_tracks).await?)
    }

    async fn add_track_to_queue(&mut self, track: &QueuedTrack) -> Result<()> {
        let author = self
            .get_or_create_author(track.author() as i64, track.username())
            .await?;
        let track_query_result = self
            .get_or_create_track_query_result(track.title(), track.url(), track.duration())
            .await?;

        self.create_track(author.id, track_query_result.id).await?;

        Ok(())
    }

    async fn skip_track(&mut self, index: i32) -> Result<()> {
        if let Some(track) = self.find_track(index).await? {
            let mut model: entity::track::ActiveModel = track.into();
            model.skip = Set(true);
            model.updated_at = Set(Utc::now().into());
            model.insert(self.conn()).await?;
        }

        Ok(())
    }
}
