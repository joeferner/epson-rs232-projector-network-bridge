use std::fmt::Write;

use anyhow::{anyhow, Context, Result};
use bytes::{Buf, BytesMut};
use log::debug;
use num_derive::{FromPrimitive, ToPrimitive};
use num_traits::{FromPrimitive, ToPrimitive};
use serde::{Deserialize, Serialize};
use tokio_util::codec::{Decoder, Encoder};
use utoipa::ToSchema;

pub struct EpsonCodec {}

impl EpsonCodec {
    pub fn new() -> Self {
        Self {}
    }

    fn parse_power_status(line: &mut BytesMut) -> Result<EpsonOutput> {
        line.advance(b"PWR=".len());
        let code = EpsonCodec::parse_u8(line)?;
        match PowerStatus::from_u8(code) {
            Some(power_status) => Ok(EpsonOutput::PowerStatus(power_status)),
            None => Err(anyhow!("unknown power status: {code}")),
        }
    }

    fn parse_source_status(line: &mut BytesMut) -> Result<EpsonOutput> {
        line.advance(b"SOURCE=".len());
        let code = EpsonCodec::parse_u8(line)?;
        match Source::from_u8(code) {
            Some(source_status) => Ok(EpsonOutput::SourceStatus(source_status)),
            None => Err(anyhow!("unknown source status: {code}")),
        }
    }

    fn parse_u8(line: &mut BytesMut) -> Result<u8> {
        let code = line.split_to(2);
        match std::str::from_utf8(&code) {
            Ok(code) => u8::from_str_radix(code, 16)
                .with_context(|| format!("failed to convert code {code} to hex")),
            Err(e) => Err(anyhow!("failed to parse hex {code:?}; error = {e}")),
        }
    }

    fn write_line(dst: &mut BytesMut, line: &str) -> Result<()> {
        debug!("writing line: {line}");
        dst.write_str(line)
            .with_context(|| format!("failed to write {line}"))?;
        dst.write_str("\r\n")
            .with_context(|| format!("failed to write {line}; new lines"))
    }

    fn write_query_power(dst: &mut BytesMut) -> Result<()> {
        EpsonCodec::write_line(dst, "PWR?")
    }

    fn write_query_source(dst: &mut BytesMut) -> Result<()> {
        EpsonCodec::write_line(dst, "SOURCE?")
    }

    fn write_set_power(dst: &mut BytesMut, power: Power) -> Result<()> {
        match power {
            Power::On => EpsonCodec::write_line(dst, "POWER ON"),
            Power::Off => EpsonCodec::write_line(dst, "POWER OFF"),
        }
    }

    fn write_set_source(dst: &mut BytesMut, source: Source) -> Result<()> {
        let source_value = source
            .to_u8()
            .ok_or(anyhow!("invalid source: {source:?}"))?;
        let cmd = format!("SOURCE {:02x}", source_value);
        EpsonCodec::write_line(dst, &cmd)
    }
}

impl Decoder for EpsonCodec {
    type Item = EpsonOutput;
    type Error = anyhow::Error;

    fn decode(&mut self, src: &mut BytesMut) -> Result<Option<Self::Item>, Self::Error> {
        let offset = src.iter().position(|b| *b == b'\r');
        if let Some(offset) = offset {
            if offset == 0 {
                return Ok(None);
            }
            let mut line = src.split_to(offset);
            while line.starts_with(b":") {
                line.advance(b":".len());
            }
            debug!("received line {line:?}");
            if line.starts_with(b"PWR=") {
                Ok(Some(EpsonCodec::parse_power_status(&mut line)?))
            } else if line.starts_with(b"SOURCE=") {
                Ok(Some(EpsonCodec::parse_source_status(&mut line)?))
            } else {
                match std::str::from_utf8(&line) {
                    Ok(str) => Ok(Some(EpsonOutput::InvalidLine(str.to_string()))),
                    Err(e) => Ok(Some(EpsonOutput::InvalidLine(format!(
                        "failed to decode; error = {e}"
                    )))),
                }
            }
        } else {
            Ok(None)
        }
    }
}

impl Encoder<EpsonInput> for EpsonCodec {
    type Error = anyhow::Error;

    fn encode(&mut self, item: EpsonInput, dst: &mut BytesMut) -> Result<(), Self::Error> {
        match item {
            EpsonInput::QueryPower => EpsonCodec::write_query_power(dst),
            EpsonInput::QuerySource => EpsonCodec::write_query_source(dst),
            EpsonInput::SetPower(power) => EpsonCodec::write_set_power(dst, power),
            EpsonInput::SetSource(source) => EpsonCodec::write_set_source(dst, source),
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum EpsonOutput {
    InvalidLine(String),
    PowerStatus(PowerStatus),
    SourceStatus(Source),
}

#[derive(Debug, PartialEq, Eq)]
pub enum EpsonInput {
    QueryPower,
    QuerySource,
    SetPower(Power),
    SetSource(Source),
}

#[derive(
    Serialize, Deserialize, Clone, Debug, ToSchema, FromPrimitive, ToPrimitive, PartialEq, Eq,
)]
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
    Serialize, Deserialize, Copy, Clone, Debug, ToSchema, FromPrimitive, ToPrimitive, PartialEq, Eq,
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

#[derive(
    Serialize, Deserialize, Clone, Copy, Debug, ToSchema, FromPrimitive, ToPrimitive, PartialEq, Eq,
)]
#[serde(rename_all = "camelCase")]
pub enum Power {
    On,
    Off,
}

impl From<PowerStatus> for Power{
    fn from(value: PowerStatus) -> Self {
        match value {
            PowerStatus::StandbyModeNetworkOff => Power::Off,
            PowerStatus::LampOn => Power::On,
            PowerStatus::Warmup => Power::On,
            PowerStatus::CoolDown => Power::Off,
            PowerStatus::AbnormalityStandby => Power::Off,
            PowerStatus::WirelessHdStandby => Power::Off,
        }
    }
}

#[cfg(test)]
mod tests {
    use futures::{FutureExt, SinkExt, StreamExt};
    use tokio::{
        io::{AsyncReadExt, AsyncWriteExt},
        net::{TcpListener, TcpStream},
    };
    use tokio_util::codec::{Decoder, Framed};

    use super::*;

    async fn create_codec() -> (TcpStream, Framed<TcpStream, EpsonCodec>) {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        let writer = TcpStream::connect(addr).await.unwrap();

        let (stream, _addr) = listener.accept().await.unwrap();
        (writer, EpsonCodec::new().framed(stream))
    }

    #[tokio::test]
    pub async fn test_decode() {
        let (mut epson, mut codec) = create_codec().await;
        epson.write(b":PWR=00\r:").await.unwrap();

        let packet = codec.next().await.unwrap().unwrap();
        assert_eq!(
            EpsonOutput::PowerStatus(PowerStatus::StandbyModeNetworkOff),
            packet
        );

        let packet = codec.next().now_or_never();
        assert!(packet.is_none(), "packet: {packet:?}");
    }

    #[tokio::test]
    pub async fn test_encode() {
        let (mut epson, mut codec) = create_codec().await;

        codec.send(EpsonInput::QueryPower).await.unwrap();

        let mut buf = BytesMut::with_capacity(1000);
        epson.read_buf(&mut buf).await.unwrap();

        assert_eq!("PWR?\r\n", std::str::from_utf8(&buf).unwrap());
    }
}
