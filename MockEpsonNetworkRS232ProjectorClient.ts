import * as Logger from "bunyan";
import {createLogger} from "../unisonht/lib/Log";
import {EpsonNetworkRS232ProjectorClient} from "./EpsonNetworkRS232ProjectorClient";
import {EpsonNetworkRS232Projector} from "./index";
import {Device} from "unisonht";

export class MockEpsonNetworkRS232ProjectorClient implements EpsonNetworkRS232ProjectorClient {
  private log: Logger;
  private input: string;
  private powerState: Device.PowerState;

  constructor() {
    this.log = createLogger('MockEpsonNetworkRS232ProjectorClient');
  }

  start(): Promise<void> {
    this.log.info('start');
    return Promise.resolve();
  }

  on(): Promise<void> {
    this.log.info('on');
    this.powerState = Device.PowerState.ON;
    return Promise.resolve();
  }

  off(): Promise<void> {
    this.log.info('off');
    this.powerState = Device.PowerState.OFF;
    return Promise.resolve();
  }

  changeInput(newInput: string): Promise<void> {
    this.log.info(`changeInput ${newInput}`);
    this.input = newInput;
    return Promise.resolve();
  }

  buttonPress(buttonName: string): Promise<void> {
    this.log.info('buttonPress ${buttonName}');
    return Promise.resolve();
  }

  getInput(): Promise<EpsonNetworkRS232Projector.Input> {
    return Promise.resolve({deviceInput: this.input});
  }

  getPowerState(): Promise<Device.PowerState> {
    return Promise.resolve(this.powerState);
  }
}
