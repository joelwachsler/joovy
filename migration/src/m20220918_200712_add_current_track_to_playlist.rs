use sea_orm_migration::prelude::*;

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
                    .add_column(
                        ColumnDef::new(Playlist::LastTrack)
                            .boolean()
                            .not_null()
                            .default(false),
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
                    .drop_column(Playlist::LastTrack)
                    .to_owned(),
            )
            .await
    }
}

#[derive(Iden)]
enum Playlist {
    Table,
    CurrentTrack,
    LastTrack,
}
