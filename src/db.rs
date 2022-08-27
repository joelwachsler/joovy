use anyhow::Result;
use migration::{Migrator, MigratorTrait};
use sea_orm::ConnectOptions;
use std::env;

pub async fn init() -> Result<()> {
    let db_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/postgres".to_string());

    let conn =
        sea_orm::Database::connect(ConnectOptions::new(db_url).sqlx_logging(false).to_owned())
            .await?;

    Migrator::up(&conn, None).await?;

    Ok(())
}
