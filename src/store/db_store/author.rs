use super::DbStore;
use anyhow::Result;
use chrono::Utc;
use entity::author::{ActiveModel, Column, Entity, Model};
use sea_orm::{prelude::*, Set};

impl DbStore {
    async fn get_or_create_author(&self, discord_id: u64, username: &str) -> Result<Model> {
        if let Some(author) = self.find_author(discord_id).await? {
            return Ok(author);
        }

        let res = self.create_author(discord_id, username).await?;
        Ok(res)
    }

    async fn create_author(&self, discord_id: u64, username: &str) -> Result<Model> {
        let new_user = ActiveModel {
            discord_id: Set(discord_id),
            username: Set(username.into()),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
            ..Default::default()
        };

        new_user.insert(self.conn()).await?;

        let res = self.find_author(discord_id).await?.unwrap();
        Ok(res)
    }

    async fn find_author(&self, discord_id: u64) -> Result<Option<Model>> {
        let res = Entity::find()
            .filter(Column::DiscordId.eq(discord_id))
            .one(self.conn())
            .await?;

        Ok(res)
    }
}
