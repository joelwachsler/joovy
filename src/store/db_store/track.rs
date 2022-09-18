use crate::store::{guild_store::Store, queued_track::QueuedTrack};

use super::DbStore;
use anyhow::Result;
use chrono::Utc;
use entity::track::*;
use sea_orm::{prelude::*, Set};
use serenity::async_trait;

impl DbStore {
    pub async fn create_track(&mut self, author: i32, track_query_result: i32) -> Result<Model> {
        let track = ActiveModel {
            index: Set(self.number_of_tracks_in_queue().await?),
            playlist: Set(self.playlist),
            skip: Set(false),
            author: Set(author),
            track_query_result: Set(track_query_result),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
            ..Default::default()
        };

        Ok(track.insert(self.conn()).await?)
    }

    pub async fn find_track(&self, index: i32) -> Result<Option<Model>> {
        let res = entity::track::Entity::find()
            .filter(Column::Playlist.eq(self.playlist))
            .filter(Column::Index.eq(index))
            .one(self.conn())
            .await?;

        Ok(res)
    }

    async fn number_of_tracks_in_queue(&self) -> Result<i32> {
        let queue = self.queue().await?;
        Ok(queue.len() as i32)
    }
}

#[async_trait]
pub trait ToQueuedTrack {
    async fn into_to_queued_track(self, conn: &DatabaseConnection) -> Result<QueuedTrack>;
}

#[async_trait]
impl ToQueuedTrack for Model {
    async fn into_to_queued_track(self, conn: &DatabaseConnection) -> Result<QueuedTrack> {
        let track_query_result = self
            .find_related(entity::track_query_result::Entity)
            .one(conn)
            .await?
            .unwrap();

        let author = self
            .find_related(entity::author::Entity)
            .one(conn)
            .await?
            .unwrap();

        Ok(QueuedTrack {
            title: track_query_result.title,
            url: track_query_result.url,
            author: author.discord_id as u64,
            username: author.username,
            duration: track_query_result.duration,
            skip: self.skip,
        })
    }
}
