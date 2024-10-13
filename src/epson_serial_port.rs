use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use futures::{sink::SinkExt, StreamExt};
use log::{debug, info};
use num_derive::{FromPrimitive, ToPrimitive};
use num_traits::{FromPrimitive, ToPrimitive};
use serde::{Deserialize, Serialize};
use tokio::{sync::RwLock, time::sleep};
use tokio_serial::{SerialPortBuilderExt, SerialStream};
use tokio_util::codec::{Decoder, Framed, LinesCodec};
use utoipa::ToSchema;

use crate::config::Config;

pub struct EpsonSerialPort {
    read_timeout: Duration,
    port: RwLock<Framed<SerialStream, LinesCodec>>,
}

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema, FromPrimitive, ToPrimitive)]
#[serde(rename_all = "camelCase")]
pub enum PowerStatus {
    StandbyModeNetworkOff = 0x00,
    LampOn = 0x01,
    Warmup = 0x02,
    CoolDown = 0x03,
    AbnormalityStandby = 0x05,
    WirelessHdStandby = 0x07,
}

#[derive(
    Serialize, Deserialize, Clone, Debug, ToSchema, FromPrimitive, ToPrimitive, PartialEq, Eq,
)]
#[serde(rename_all = "camelCase")]
pub enum Source {
    Input1 = 0x10,
    Input2DSub15 = 0x20,
    Input2Rgb = 0x21,
    Input3Hdmi = 0x30,
    Input3DigitalRgb = 0x31,
    Video = 0x40,
    VideoRca = 0x41,
    Hdmi2 = 0xa0,
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
        let resp = write_command(&mut port, "PWR?", self.read_timeout).await?;
        if !resp.starts_with("PWR=") {
            return Err(anyhow!("invalid power response {resp}"));
        }
        let code = u8::from_str_radix(resp["PWR=".len()..].trim(), 16)
            .context(format!("failed to parse power status {resp}"))?;
        if let Some(status) = PowerStatus::from_u8(code) {
            Ok(status)
        } else {
            Err(anyhow!("unexpected power status code {resp}"))
        }
    }

    pub async fn get_source(&self) -> Result<Source> {
        let mut port = self.port.write().await;
        self._get_source(&mut port).await
    }

    async fn _get_source(&self, port: &mut Framed<SerialStream, LinesCodec>) -> Result<Source> {
        let resp = write_command(port, "SOURCE?", self.read_timeout).await?;
        if !resp.starts_with("SOURCE=") {
            return Err(anyhow!("invalid source response {resp}"));
        }
        let code = u8::from_str_radix(resp["SOURCE=".len()..].trim(), 16)
            .context(format!("failed to parse source {resp}"))?;
        if let Some(source) = Source::from_u8(code) {
            Ok(source)
        } else {
            Err(anyhow!("unexpected source {resp}"))
        }
    }

    pub async fn set_source(&self, source: Source) -> Result<()> {
        let source_value = source
            .to_u8()
            .ok_or(anyhow!("invalid source: {source:?}"))?;
        let cmd = format!("SOURCE {:02x}", source_value);

        let mut port = self.port.write().await;
        for _ in 0..3 {
            let current_source = self._get_source(&mut port).await?;
            if current_source == source {
                return Ok(());
            }
            write_command(&mut port, &cmd, self.read_timeout).await?;
            sleep(self.read_timeout).await;
        }

        Err(anyhow!("failed to set source"))
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
