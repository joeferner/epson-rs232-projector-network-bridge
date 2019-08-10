import { EpsonNetworkRS232ProjectorClient } from './EpsonNetworkRS232ProjectorClient';
import { EpsonNetworkRS232Projector } from './index';
import Debug from 'debug';
import { EpsonNetworkRS232ProjectorClientButton } from './EpsonNetworkRS232ProjectorClientButton';
import { EpsonNetworkRS232ProjectorClientInput } from './EpsonNetworkRS232ProjectorClientInput';

const debug = Debug('EpsonNetworkRS232Projector:ClientMock');

export class EpsonNetworkRS232ProjectorClientMock implements EpsonNetworkRS232ProjectorClient {
  private input: EpsonNetworkRS232ProjectorClientInput = EpsonNetworkRS232ProjectorClientInput.HDMI1;
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

  public async changeInput(input: EpsonNetworkRS232ProjectorClientInput): Promise<void> {
    debug(`changeInput ${input}`);
    this.input = input;
  }

  public async buttonPress(button: EpsonNetworkRS232ProjectorClientButton): Promise<void> {
    debug(`buttonPress ${button}`);
  }

  public async getInput(): Promise<EpsonNetworkRS232ProjectorClientInput> {
    return this.input;
  }

  public async getPowerState(): Promise<EpsonNetworkRS232Projector.PowerState> {
    return this.powerState;
  }
}
