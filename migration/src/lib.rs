pub use sea_orm_migration::prelude::*;

mod m20220827_221700_create_author_table;
mod m20220827_222355_create_playlist_table;
mod m20220827_232513_create_track_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220827_221700_create_author_table::Migration),
            Box::new(m20220827_222355_create_playlist_table::Migration),
            Box::new(m20220827_232513_create_track_table::Migration),
        ]
    }
}
