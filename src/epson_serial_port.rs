use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use futures::SinkExt;
use log::info;
use tokio::{
    sync::RwLock,
    time::{sleep, timeout},
};
use tokio_serial::{ClearBuffer, SerialPort, SerialPortBuilderExt, SerialStream};
use tokio_stream::StreamExt;
use tokio_util::codec::{Decoder, Framed};

use crate::{
    config::Config,
    epson_codec::{EpsonCodec, EpsonInput, EpsonOutput, Power, PowerStatus, Source},
};

pub struct EpsonSerialPort {
    read_timeout: Duration,
    port: RwLock<Framed<SerialStream, EpsonCodec>>,
}

impl EpsonSerialPort {
    pub async fn new(config: &Config) -> Result<Self> {
        info!("opening serial port {} 9600 8N1", &config.serial_port);
        let port = tokio_serial::new(&config.serial_port, 9600)
            .data_bits(tokio_serial::DataBits::Eight)
            .parity(tokio_serial::Parity::None)
            .stop_bits(tokio_serial::StopBits::One)
            .open_native_async()
            .context(format!("failed to open serial port {}", config.serial_port))?;

        let port = EpsonCodec::new().framed(port);

        Ok(EpsonSerialPort {
            read_timeout: config.read_timeout,
            port: RwLock::new(port),
        })
    }

    pub async fn get_power_status(&self) -> Result<PowerStatus> {
        let mut port = self.port.write().await;
        self._get_power_status(&mut port).await
    }

    async fn _get_power_status(
        &self,
        port: &mut Framed<SerialStream, EpsonCodec>,
    ) -> Result<PowerStatus> {
        let resp = write_command(port, EpsonInput::QueryPower, self.read_timeout).await?;
        match resp {
            EpsonOutput::PowerStatus(power_status) => Ok(power_status),
            _ => Err(anyhow!("invalid response to query power; resp = {resp:?}")),
        }
    }

    pub async fn get_source(&self) -> Result<Source> {
        let mut port = self.port.write().await;
        self._get_source(&mut port).await
    }

    async fn _get_source(&self, port: &mut Framed<SerialStream, EpsonCodec>) -> Result<Source> {
        let resp = write_command(port, EpsonInput::QuerySource, self.read_timeout).await?;
        match resp {
            EpsonOutput::SourceStatus(source_status) => Ok(source_status),
            _ => Err(anyhow!("invalid response to query power; resp = {resp:?}")),
        }
    }

    pub async fn set_source(&self, target_source: Source) -> Result<()> {
        let mut port = self.port.write().await;
        for _ in 0..3 {
            let current_source = self._get_source(&mut port).await?;
            if current_source == target_source {
                return Ok(());
            }
            write_command(
                &mut port,
                EpsonInput::SetSource(target_source),
                self.read_timeout,
            )
            .await?;
            sleep(self.read_timeout).await;
        }

        Err(anyhow!("failed to set source"))
    }

    pub async fn set_power(&self, target_power: Power) -> Result<()> {
        let mut port = self.port.write().await;
        for _ in 0..3 {
            let current_power: Power = self._get_power_status(&mut port).await?.into();
            if current_power == target_power {
                return Ok(());
            }
            write_command(
                &mut port,
                EpsonInput::SetPower(target_power),
                self.read_timeout,
            )
            .await?;
            sleep(self.read_timeout).await;
        }

        Err(anyhow!("failed to set source"))
    }
}

async fn write_command(
    port: &mut Framed<SerialStream, EpsonCodec>,
    cmd: EpsonInput,
    read_timeout: Duration,
) -> Result<EpsonOutput> {
    clear_port(port).await?;
    port.send(cmd).await?;
    let ret = timeout(read_timeout, port.next()).await?;
    match ret {
        Some(ret) => ret,
        None => Err(anyhow!("failed to read response, nothing returned")),
    }
}

async fn clear_port(port: &mut Framed<SerialStream, EpsonCodec>) -> Result<()> {
    port.read_buffer_mut().clear();
    port.get_ref().clear(ClearBuffer::All)?;
    Ok(())
}
