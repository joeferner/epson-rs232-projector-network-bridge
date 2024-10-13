use std::{env, str::FromStr};

use anyhow::Result;

pub struct Config {
    pub log_level: log::LevelFilter,
}

impl Config {
    pub fn new() -> Result<Config> {
        let log_level = env::var("LOG_LEVEL").unwrap_or("info".to_string());

        Ok(Config {
            log_level: log::LevelFilter::from_str(&log_level)?,
        })
    }
}
