import { EpsonNetworkRS232ProjectorClient } from './EpsonNetworkRS232ProjectorClient';
import { EpsonNetworkRS232Projector } from './index';
import Debug from 'debug';

const debug = Debug('EpsonNetworkRS232Projector:ClientMock');

export class EpsonNetworkRS232ProjectorClientMock implements EpsonNetworkRS232ProjectorClient {
  private input: EpsonNetworkRS232Projector.Input = EpsonNetworkRS232Projector.Input.HDMI1;
  private powerState: EpsonNetworkRS232Projector.PowerState = EpsonNetworkRS232Projector.PowerState.UNKNOWN;

  public async start(): Promise<void> {
    debug('start');
  }

  public async on(): Promise<void> {
    debug('on');
    this.powerState = EpsonNetworkRS232Projector.PowerState.ON;
  }

  public async off(): Promise<void> {
    debug('off');
    this.powerState = EpsonNetworkRS232Projector.PowerState.OFF;
  }

  public async changeInput(input: EpsonNetworkRS232Projector.Input): Promise<void> {
    debug(`changeInput ${input}`);
    this.input = input;
  }

  public async buttonPress(buttonName: string): Promise<void> {
    debug(`buttonPress ${buttonName}`);
  }

  public async getInput(): Promise<EpsonNetworkRS232Projector.Input> {
    return this.input;
  }

  public async getPowerState(): Promise<EpsonNetworkRS232Projector.PowerState> {
    return this.powerState;
  }
}
