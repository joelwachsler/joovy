mod client;
mod command_context;
mod commands;
mod db;
mod graphql;
mod store;

use anyhow::Result;
use tracing::instrument;

#[tokio::main]
#[instrument]
async fn main() -> Result<()> {
    logger::init().expect("Failed to init logger");
    let conn = db::init().await?;

    tokio::try_join!(client::run(conn.clone()), graphql::server::start_graphql_server(conn))?;

    Ok(())
}
