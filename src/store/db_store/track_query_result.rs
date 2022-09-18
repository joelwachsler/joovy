use super::DbStore;
use anyhow::Result;
use chrono::Utc;
use entity::track_query_result::*;
use sea_orm::{prelude::*, Set};

impl DbStore {
    pub async fn get_or_create_track_query_result(
        &self,
        title: &str,
        url: &str,
        duration: &i32,
    ) -> Result<Model> {
        if let Some(query_result) = self.find_track_query_result_by_url(url).await? {
            return Ok(query_result);
        }

        self.create_track_query_result(title, url, duration).await
    }

    async fn create_track_query_result(
        &self,
        title: &str,
        url: &str,
        duration: &i32,
    ) -> Result<Model> {
        let new_track_query_result = ActiveModel {
            title: Set(title.into()),
            url: Set(url.into()),
            duration: Set(*duration),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
            ..Default::default()
        };

        Ok(new_track_query_result.insert(self.conn()).await?)
    }

    async fn find_track_query_result_by_url(&self, url: &str) -> Result<Option<Model>> {
        let res = Entity::find()
            .filter(Column::Url.eq(url))
            .one(self.conn())
            .await?;

        Ok(res)
    }
}
