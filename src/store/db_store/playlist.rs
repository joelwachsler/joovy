use anyhow::Result;
use chrono::Utc;
use entity::playlist::*;
use sea_orm::{prelude::*, Set};

use super::DbStore;

pub async fn create_playlist(conn: &DatabaseConnection, channel_id: &u64) -> Result<Model> {
    let id = Uuid::new_v4();

    let playlist = ActiveModel {
        id: Set(id),
        channel_id: Set(*channel_id as i64),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    Ok(playlist.insert(conn).await?)
}

pub async fn find_playlist(conn: &DatabaseConnection, id: &Uuid) -> Result<Option<Model>> {
    Ok(Entity::find_by_id(*id).one(conn).await?)
}

impl DbStore {
    pub async fn find_playlist(&self, id: &Uuid) -> Result<Option<Model>> {
        find_playlist(self.conn(), id).await
    }
}
