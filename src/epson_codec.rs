use bytes::BytesMut;
use tokio_util::codec::{Decoder, Encoder};

pub struct EpsonCodec {}

impl EpsonCodec {
    pub fn new() -> Self {
        Self {}
    }
}

impl Decoder for EpsonCodec {
    type Item = EpsonOutput;
    type Error = anyhow::Error;

    fn decode(&mut self, src: &mut BytesMut) -> Result<Option<Self::Item>, Self::Error> {
        todo!()
    }
}

impl Encoder<EpsonInput> for EpsonCodec {
    type Error = anyhow::Error;

    fn encode(&mut self, item: EpsonInput, dst: &mut BytesMut) -> Result<(), Self::Error> {
        todo!()
    }
}

pub struct EpsonOutput {}

pub struct EpsonInput {}

#[cfg(test)]
mod tests {
    use crate::mock_stream::MockStream;

    use super::*;

    #[tokio::test]
    pub async fn test_decode() {
        //  P  W  R  =  0  0 \r
        // 50 57 52 3d 30 30 0d
        // 3a - :
        let mut data = MockStream::from(b"PWR=00\r:");
        EpsonCodec::new().framed(data);
    }
}
