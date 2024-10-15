use futures::io::Cursor;

pub struct MockStream {}

impl From<&[&[u8]]> for MockStream {
    fn from(buf: &[&[u8]]) -> Self {
        let packets = buf
            .iter()
            .map(|b| Packet::from(*b))
            .collect::<Vec<Packet>>();
        Self { index: 0, packets }
    }
}

#[derive(Debug, Default)]
pub struct Packet {
    buffer: Cursor<Vec<u8>>,
}

impl From<&[u8]> for Packet {
    fn from(buf: &[u8]) -> Self {
        Packet {
            buffer: Cursor::new(Vec::from(buf)),
        }
    }
}

impl AsRef<[u8]> for Packet {
    fn as_ref(&self) -> &[u8] {
        self.buffer.get_ref()
    }
}
