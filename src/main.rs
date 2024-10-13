use anyhow::Result;
use config::Config;
use http::http_start_server;
use log::info;
use logger::init_logger;

mod http;
mod logger;
mod config;

#[tokio::main]
async fn main() -> Result<()> {
    let config = Config::new()?;
    init_logger(&config)?;
    info!("starting unisonht-epson-network-rs232-projector");

    http_start_server().await?;
    Ok(())
}
