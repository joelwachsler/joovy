use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Playlist::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Playlist::Id).uuid().not_null().primary_key())
                    .col(
                        ColumnDef::new(Playlist::ChannelId)
                            .big_unsigned()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Playlist::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Playlist::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Playlist::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Playlist {
    Table,
    Id,
    ChannelId,
    CreatedAt,
    UpdatedAt,
}
