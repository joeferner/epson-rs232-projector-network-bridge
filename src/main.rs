use std::sync::Arc;

use anyhow::Result;
use config::Config;
use epson_serial_port::EpsonSerialPort;
use http::http_start_server;
use log::info;
use state::EpsonState;

mod config;
mod epson_codec;
mod epson_serial_port;
mod http;
mod logger;
mod routes;
mod state;

#[tokio::main]
async fn main() -> Result<()> {
    let config = Config::new()?;
    info!("starting epson-rs232-projector-network-bridge");

    let epson = EpsonSerialPort::new(&config).await?;
    let state = Arc::new(EpsonState { epson });

    http_start_server(&config, state).await?;

    Ok(())
}
