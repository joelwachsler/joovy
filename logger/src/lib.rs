use std::str::FromStr;

use anyhow::Result;
use tracing::metadata::LevelFilter;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, Layer};

pub fn init() -> Result<()> {
    dotenv::dotenv().ok();
    let console_level = std::env::var("RUST_LOG")
        .map(|l| LevelFilter::from_str(l.as_str()).unwrap())
        .unwrap_or(LevelFilter::INFO);

    tracing_subscriber::registry()
        // Continue logging to stdout
        .with(
            fmt::Layer::default()
                .compact()
                .with_file(false)
                .with_line_number(true)
                .with_thread_ids(false)
                .with_target(true)
                .with_filter(console_level),
        )
        .try_init()?;

    Ok(())
}
