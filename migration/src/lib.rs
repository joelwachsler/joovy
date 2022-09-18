pub use sea_orm_migration::prelude::*;

mod m20220827_221700_create_author_table;
mod m20220827_222355_create_playlist_table;
mod m20220827_232513_create_track_table;
mod m20220903_183232_create_track_query_result;
mod m20220903_184828_add_track_query_result_to_track;
mod m20220903_185259_add_track_query_table;
mod m20220903_185411_track_query_result_to_track_query_table;
mod m20220918_200712_add_current_track_to_playlist;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220827_221700_create_author_table::Migration),
            Box::new(m20220827_222355_create_playlist_table::Migration),
            Box::new(m20220827_232513_create_track_table::Migration),
            Box::new(m20220903_183232_create_track_query_result::Migration),
            Box::new(m20220903_184828_add_track_query_result_to_track::Migration),
            Box::new(m20220903_185259_add_track_query_table::Migration),
            Box::new(m20220903_185411_track_query_result_to_track_query_table::Migration),
            Box::new(m20220918_200712_add_current_track_to_playlist::Migration),
        ]
    }
}
