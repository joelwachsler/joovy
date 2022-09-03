use sea_orm_migration::prelude::*;

use crate::{
    m20220827_221700_create_author_table::Author, m20220827_222355_create_playlist_table::Playlist,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Track::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Track::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Track::Playlist).uuid().not_null())
                    .foreign_key(
                        ForeignKeyCreateStatement::new()
                            .from_tbl(Track::Table)
                            .to_tbl(Playlist::Table)
                            .from_col(Track::Playlist)
                            .to_col(Playlist::Id),
                    )
                    .col(
                        ColumnDef::new(Track::Skip)
                            .boolean()
                            .not_null()
                            .default(false),
                    )
                    .col(ColumnDef::new(Track::Author).integer().not_null())
                    .foreign_key(
                        ForeignKeyCreateStatement::new()
                            .from_tbl(Track::Table)
                            .to_tbl(Author::Table)
                            .from_col(Track::Author)
                            .to_col(Author::Id),
                    )
                    .col(
                        ColumnDef::new(Track::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Track::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Track::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Track {
    Table,
    Id,
    Playlist,
    Skip,
    Author,
    CreatedAt,
    UpdatedAt,
}
