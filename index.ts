import {Device, DeviceOptions} from "unisonht/lib/Device";

interface EpsonNetworkRS232ProjectorOptions extends DeviceOptions {
  address: string;
  inputs: {
    [deviceInputName: string];
  }
}

export default class EpsonNetworkRS232Projector extends Device {
  constructor(options: EpsonNetworkRS232ProjectorOptions) {
    super(options);
  }
}