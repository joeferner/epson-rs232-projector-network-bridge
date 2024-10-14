use std::{env, str::FromStr, time::Duration};

use anyhow::{anyhow, Context, Result};
use log::info;

pub struct Config {
    pub log_level: log::LevelFilter,
    pub serial_port: String,
    pub read_timeout: Duration,
}

impl Config {
    pub fn new() -> Result<Config> {
        let log_level = env::var("LOG_LEVEL").unwrap_or("info".to_string());
        let timeout = env::var("TIMEOUT").unwrap_or("3".to_string());
        let timeout = timeout
            .parse::<u64>()
            .context(format!("invalid TIMEOUT {timeout}"))?;

        let serial_port = find_serial_port()?;

        Ok(Config {
            log_level: log::LevelFilter::from_str(&log_level)?,
            serial_port,
            read_timeout: Duration::from_secs(timeout),
        })
    }
}

fn find_serial_port() -> Result<String> {
    if let Ok(serial_port) = env::var("SERIAL_PORT") {
        return Ok(serial_port);
    }

    let available_ports = tokio_serial::available_ports()?;
    for available_port in available_ports {
        info!("available_port: {available_port:?}");
    }

    Err(anyhow!(
        "could not find available port and SERIAL_PORT is not set"
    ))
}
