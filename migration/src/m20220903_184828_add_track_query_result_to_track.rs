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
                    .table(Track::Table)
                    .add_column(ColumnDef::new(Track::TrackQueryResult).integer().not_null())
                    .add_foreign_key(
                        TableForeignKey::new()
                            .from_tbl(Track::Table)
                            .to_tbl(TrackQueryResult::Table)
                            .from_col(Track::TrackQueryResult)
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
                    .table(Track::Table)
                    .drop_column(Track::TrackQueryResult)
                    .to_owned(),
            )
            .await
    }
}

#[derive(Iden)]
enum Track {
    Table,
    TrackQueryResult,
}
