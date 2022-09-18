use anyhow::Result;
use async_graphql::*;
use sea_orm::DatabaseConnection;
use serenity::async_trait;

use crate::store::{
    db_store::{self, ToQueuedTracks},
    queued_track::QueuedTrack,
};

use super::server::WithAppState;

#[derive(Default)]
pub struct Query;

#[Object]
impl Query {
    async fn queue(
        &self,
        ctx: &Context<'_>,
        channel_id: StringNumber<u64>,
    ) -> Result<Option<Playlist>> {
        let conn = ctx.app_state().conn();
        let store = db_store::DbStore::create_with_current_playlist(conn, &channel_id.0).await?;
        let store = match store {
            Some(store) => store,
            None => return Ok(None),
        };

        let playlist = store.get_playlist().await?;
        Ok(Some(playlist.to_playlist(conn).await?))
    }
}

#[async_trait]
trait ToPlaylist {
    async fn to_playlist(&self, conn: &DatabaseConnection) -> Result<Playlist>;
}

#[async_trait]
impl ToPlaylist for entity::playlist::Model {
    async fn to_playlist(&self, conn: &DatabaseConnection) -> Result<Playlist> {
        let tracks = self.to_queued_tracks(conn).await?;

        Ok(Playlist {
            tracks: tracks.into_iter().map(|track| track.into()).collect(),
        })
    }
}

impl From<QueuedTrack> for Track {
    fn from(track: QueuedTrack) -> Self {
        Track {
            title: track.title,
            url: track.url,
            duration: track.duration,
        }
    }
}

#[derive(SimpleObject)]
struct Playlist {
    tracks: Vec<Track>,
}

#[derive(SimpleObject)]
struct Track {
    title: String,
    url: String,
    duration: i32,
}
