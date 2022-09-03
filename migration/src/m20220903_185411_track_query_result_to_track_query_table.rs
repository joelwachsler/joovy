use sea_orm_migration::prelude::*;

use crate::m20220903_183232_create_track_query_result::TrackQueryResult;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(TrackQuery::Table)
                    .add_column(
                        ColumnDef::new(TrackQuery::TrackQueryResult)
                            .integer()
                            .not_null(),
                    )
                    .add_foreign_key(
                        TableForeignKey::new()
                            .from_tbl(TrackQuery::Table)
                            .to_tbl(TrackQueryResult::Table)
                            .from_col(TrackQuery::TrackQueryResult)
                            .to_col(TrackQueryResult::Id),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(TrackQuery::Table)
                    .drop_column(TrackQuery::TrackQueryResult)
                    .to_owned(),
            )
            .await
    }
}

#[derive(Iden)]
enum TrackQuery {
    Table,
    TrackQueryResult,
}
