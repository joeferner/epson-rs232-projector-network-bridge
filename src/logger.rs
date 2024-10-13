use anyhow::{Context, Result};
use log4rs::{
    append::console::ConsoleAppender,
    config::{Appender, Root},
};

use crate::config::Config;

pub fn init_logger(config: &Config) -> Result<()> {
    let stdout = ConsoleAppender::builder().build();
    let config = log4rs::Config::builder()
        .appender(Appender::builder().build("stdout", Box::new(stdout)))
        .build(Root::builder().appender("stdout").build(config.log_level))
        .unwrap();
    log4rs::init_config(config).context("failed to initialize default logger")?;

    Ok(())
}
