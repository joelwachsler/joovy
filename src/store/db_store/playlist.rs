use anyhow::Result;
use chrono::Utc;
use entity::playlist::*;
use sea_orm::{prelude::*, QueryOrder, QuerySelect, Set};

use super::DbStore;

pub async fn create_playlist(conn: &DatabaseConnection, channel_id: &u64) -> Result<Model> {
    let id = Uuid::new_v4();

    let playlist = ActiveModel {
        id: Set(id),
        channel_id: Set(*channel_id as i64),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
        ..Default::default()
    };

    Ok(playlist.insert(conn).await?)
}

pub async fn find_playlist(conn: &DatabaseConnection, id: &Uuid) -> Result<Option<Model>> {
    Ok(Entity::find_by_id(*id).one(conn).await?)
}

impl DbStore {
    pub async fn find_playlist(&self) -> Result<Option<Model>> {
        find_playlist(self.conn(), &self.playlist).await
    }

    pub async fn get_playlist(&self) -> Result<Model> {
        let res = self
            .find_playlist()
            .await?
            .expect("Programming error: Failed to find playlist");

        Ok(res)
    }

    pub async fn find_last_playlists(&self, limit: u64) -> Result<Vec<Model>> {
        let res = Entity::find()
            .filter(Column::ChannelId.eq(self.channel_id))
            .filter(Column::Id.ne(self.playlist))
            .order_by_desc(Column::UpdatedAt)
            .limit(limit)
            .all(self.conn())
            .await?;

        Ok(res)
    }
}
