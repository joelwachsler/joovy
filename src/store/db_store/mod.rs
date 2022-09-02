use anyhow::Result;
use chrono::Utc;
use entity::author::Column;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serenity::async_trait;
use tracing::error;

use super::{guild_store::Store, queued_track::QueuedTrack};

pub struct DbStore {
    conn: DatabaseConnection,
}

impl DbStore {
    pub fn new(conn: DatabaseConnection) -> Self {
        Self { conn }
    }
}

#[async_trait]
impl Store for DbStore {
    // async fn queue_changed(&self, new_queue: Vec<QueuedTrack>) -> Result<()> {
    //     for item in new_queue {
    //         let _ = self
    //             .get_or_create_author(item.author(), item.username())
    //             .await
    //             .map_err(|e| error!("Failed to get or create user: {e:?}"));
    //     }

    //     Ok(())
    // }
}

impl DbStore {
    async fn get_or_create_author(
        &self,
        discord_id: u64,
        username: &str,
    ) -> Result<entity::author::Model> {
        if let Some(author) = self.find_author(discord_id).await? {
            return Ok(author);
        }

        let res = self.create_author(discord_id, username).await?;
        Ok(res)
    }

    async fn create_author(
        &self,
        discord_id: u64,
        username: &str,
    ) -> Result<entity::author::Model> {
        let new_user = entity::author::ActiveModel {
            discord_id: Set(discord_id),
            username: Set(username.into()),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
            ..Default::default()
        };

        new_user.insert(&self.conn).await?;

        let res = self.find_author(discord_id).await?.unwrap();
        Ok(res)
    }

    async fn find_author(&self, discord_id: u64) -> Result<Option<entity::author::Model>> {
        let res = entity::author::Entity::find()
            .filter(Column::DiscordId.eq(discord_id))
            .one(&self.conn)
            .await?;

        Ok(res)
    }
}
