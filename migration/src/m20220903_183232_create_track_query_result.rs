use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(TrackQueryResult::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(TrackQueryResult::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(TrackQueryResult::Title).string().not_null())
                    .col(
                        ColumnDef::new(TrackQueryResult::Url)
                            .string()
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(TrackQueryResult::Duration)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(TrackQueryResult::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(TrackQueryResult::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TrackQueryResult::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum TrackQueryResult {
    Table,
    Id,
    Title,
    Url,
    Duration,
    CreatedAt,
    UpdatedAt,
}
