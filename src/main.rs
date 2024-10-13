use std::sync::Arc;

use anyhow::Result;
use config::Config;
use epson_serial_port::EpsonSerialPort;
use http::http_start_server;
use log::info;
use logger::init_logger;
use state::State;
use tokio::sync::RwLock;

mod config;
mod epson_serial_port;
mod http;
mod logger;
mod state;

#[tokio::main]
async fn main() -> Result<()> {
    let config = Config::new()?;
    init_logger(&config)?;
    info!("starting unisonht-epson-network-rs232-projector");

    let epson = EpsonSerialPort::new(&config)?;
    info!(
        "current power status: {:?}",
        epson.get_power_status().await?
    );

    let state = Arc::new(State {
        epson: RwLock::new(epson),
    });

    http_start_server(state).await?;
    Ok(())
}
