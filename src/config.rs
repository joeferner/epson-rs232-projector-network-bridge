use std::{env, str::FromStr, time::Duration};

use anyhow::{Context, Result};

pub struct Config {
    pub log_level: log::LevelFilter,
    pub serial_port: String,
    pub read_timeout: Duration,
}

impl Config {
    pub fn new() -> Result<Config> {
        let log_level = env::var("LOG_LEVEL").unwrap_or("info".to_string());
        let timeout = env::var("TIMEOUT").unwrap_or("1".to_string());
        let timeout = timeout
            .parse::<u64>()
            .context(format!("invalid TIMEOUT {timeout}"))?;

        Ok(Config {
            log_level: log::LevelFilter::from_str(&log_level)?,
            serial_port: env::var("SERIAL_PORT").context("SERIAL_PORT env variable not found")?,
            read_timeout: Duration::from_secs(timeout),
        })
    }
}
