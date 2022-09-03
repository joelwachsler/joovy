use sea_orm_migration::prelude::*;

use crate::m20220827_232513_create_track_table::Track;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Playlist::Table)
                    .add_column(ColumnDef::new(Playlist::CurrentTrack).integer())
                    .add_foreign_key(
                        TableForeignKey::new()
                            .from_tbl(Playlist::Table)
                            .to_tbl(Track::Table)
                            .from_col(Playlist::CurrentTrack)
                            .to_col(Track::Id),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Playlist::Table)
                    .drop_column(Playlist::CurrentTrack)
                    .to_owned(),
            )
            .await
    }
}

#[derive(Iden)]
enum Playlist {
    Table,
    CurrentTrack,
}
