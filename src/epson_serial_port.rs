use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use futures::{sink::SinkExt, StreamExt};
use log::{debug, info};
use tokio::{sync::RwLock, time::sleep};
use tokio_serial::{SerialPortBuilderExt, SerialStream};
use tokio_util::codec::{Decoder, Framed, LinesCodec};

use crate::config::Config;

pub struct EpsonSerialPort {
    read_timeout: Duration,
    port: RwLock<Framed<SerialStream, LinesCodec>>,
}

#[derive(Debug)]
pub enum PowerStatus {
    On,
    Off,
}

impl EpsonSerialPort {
    pub fn new(config: &Config) -> Result<Self> {
        info!("opening serial port {} 9600 8N1", &config.serial_port);
        let port = tokio_serial::new(&config.serial_port, 9600)
            .data_bits(tokio_serial::DataBits::Eight)
            .parity(tokio_serial::Parity::None)
            .stop_bits(tokio_serial::StopBits::One)
            .open_native_async()
            .context(format!("failed to open serial port {}", config.serial_port))?;
        let port = LinesCodec::new().framed(port);

        Ok(EpsonSerialPort {
            read_timeout: config.read_timeout,
            port: RwLock::new(port),
        })
    }

    pub async fn get_power_status(&self) -> Result<PowerStatus> {
        let mut port = self.port.write().await;
        let resp = write_command(&mut port, "?PWR", self.read_timeout).await?;
        if !resp.starts_with("PWR=") {
            return Err(anyhow!("invalid power response {resp}"));
        }
        let code = resp["PWR=".len()..].trim();
        if code == "01" || code == "02" {
            Ok(PowerStatus::On)
        } else if code == "00" {
            Ok(PowerStatus::Off)
        } else {
            Err(anyhow!("unexpected power status code {resp}"))
        }
    }
}

async fn write_command(
    port: &mut Framed<SerialStream, LinesCodec>,
    cmd: &str,
    timeout: Duration,
) -> Result<String> {
    debug!("sending command {cmd}");
    let cmd_data = cmd.to_string() + "\r\n";

    port.send(cmd_data).await?;

    tokio::select! {
        line = port.next() => {
            if let Some(line) = line {
                let line = line?;
                let line = line.trim().to_string();
                debug!("recv {line}");
                return Ok(line);
            }
            Err(anyhow!("failed to read line"))
        }
        _ = sleep(timeout) => {
            Err(anyhow!("timeout waiting for response to command {}", cmd))
        }
    }
}
