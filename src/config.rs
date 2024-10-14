use std::{env, str::FromStr, time::Duration};

use crate::logger::init_logger;
use anyhow::{anyhow, Context, Result};
use log::{debug, info};

pub struct Config {
    pub serial_port: String,
    pub read_timeout: Duration,
}

impl Config {
    pub fn new() -> Result<Config> {
        let log_level = env::var("LOG_LEVEL").unwrap_or("info".to_string());
        let log_level = log::LevelFilter::from_str(&log_level)?;
        init_logger(log_level)?;

        let timeout = env::var("TIMEOUT").unwrap_or("3".to_string());
        let timeout = timeout
            .parse::<u64>()
            .context(format!("invalid TIMEOUT {timeout}"))?;

        let serial_port = find_serial_port()?;

        Ok(Config {
            serial_port,
            read_timeout: Duration::from_secs(timeout),
        })
    }
}

fn find_serial_port() -> Result<String> {
    if let Ok(serial_port) = env::var("SERIAL_PORT") {
        return Ok(serial_port);
    }

    debug!("SERIAL_PORT environment variable not set, searching for serial port");
    let mut found_port = None;
    let available_ports = serialport::available_ports()?;
    for available_port in available_ports {
        debug!("available_port: {available_port:?}");
        if available_port.port_name == "/dev/ttyAMA0" {
            continue;
        }
        if found_port.is_some() {
            return Err(anyhow!(
                "SERIAL_PORT not set and multiple serial ports were found"
            ));
        }
        found_port = Some(available_port.port_name);
    }

    if let Some(found_port) = found_port {
        return Ok(found_port);
    }

    Err(anyhow!(
        "could not find available port and SERIAL_PORT is not set"
    ))
}
