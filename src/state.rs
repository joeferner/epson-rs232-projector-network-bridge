use tokio::sync::RwLock;

use crate::epson_serial_port::EpsonSerialPort;

pub struct State {
    pub epson: RwLock<EpsonSerialPort>,
}
