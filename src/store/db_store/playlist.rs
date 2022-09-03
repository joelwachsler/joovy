use anyhow::Result;
use chrono::Utc;
use entity::playlist::{ActiveModel, Entity, Model};
use sea_orm::{prelude::*, Set};

pub async fn create_playlist(conn: &DatabaseConnection, channel_id: &str) -> Result<Model> {
    let id = Uuid::new_v4();

    let new_playlist = ActiveModel {
        id: Set(id),
        channel_id: Set(channel_id.into()),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    new_playlist.insert(conn).await?;

    let res = find_playlist(conn, &id).await?.unwrap();
    Ok(res)
}

pub async fn find_playlist(conn: &DatabaseConnection, id: &Uuid) -> Result<Option<Model>> {
    let res = Entity::find_by_id(id.clone()).one(conn).await?;

    Ok(res)
}
