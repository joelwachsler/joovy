mod author;
mod playlist;

use anyhow::Result;
use chrono::Utc;
use sea_orm::{
    prelude::Uuid, ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
};
use serenity::async_trait;

use super::{
    guild_store::{CurrentTrack, Store},
    queued_track::QueuedTrack,
};

pub struct DbStore {
    conn: DatabaseConnection,
    playlist: entity::playlist::Model,
}

impl DbStore {
    pub async fn create(conn: DatabaseConnection, channel_id: &str) -> Result<Self> {
        let playlist = create_playlist(&conn, channel_id).await?;
        Ok(Self { conn, playlist })
    }

    fn conn(&self) -> &DatabaseConnection {
        &self.conn
    }
}

#[async_trait]
impl Store for DbStore {
    async fn current_track(&self) -> Result<CurrentTrack> {
        Ok(self.current_track)
    }

    async fn set_current_track(&mut self, track: &CurrentTrack) -> Result<()> {
        self.current_track = *track;
        Ok(())
    }

    async fn queue(&self) -> Result<Vec<QueuedTrack>> {
        let res = entity::track::Entity::find()
            .filter(entity::track::Column::Playlist.eq(self.playlist_id))
            .all(&self.conn)
            .await?;

        Ok(res.into_iter().map(|item| item.into()).collect())
    }

    async fn add_track_to_queue(&mut self, track: &QueuedTrack) -> Result<()> {
        self.queue.push(track.clone());
        Ok(())
    }

    async fn edit_track(&mut self, index: usize, track: &QueuedTrack) -> Result<()> {
        self.queue[index] = track.clone();
        Ok(())
    }
}

impl From<entity::track::Model> for QueuedTrack {
    fn from(item: entity::track::Model) -> Self {
        // QueuedTrack {
        //     title: item.,
        //     url: item.link,
        //     author: item.author,
        //     username: item.id,
        //     duration: todo!(),
        //     skip: todo!(),
        // }

        todo!()
    }
}
