import { EpsonNetworkRS232ProjectorClient } from './EpsonNetworkRS232ProjectorClient';
import { EpsonNetworkRS232Projector } from './index';
import axios from 'axios';
import Debug from 'debug';
import { EpsonNetworkRS232ProjectorClientButton } from './EpsonNetworkRS232ProjectorClientButton';
import { EpsonNetworkRS232ProjectorClientInput } from './EpsonNetworkRS232ProjectorClientInput';

const debug = Debug('EpsonNetworkRS232Projector:ClientImpl');

const TIMEOUT_SHORT = 5 * 1000;
const TIMEOUT_LONG = 60 * 1000;

export class EpsonNetworkRS232ProjectorClientImpl implements EpsonNetworkRS232ProjectorClient {
  private readonly address: string;
  private readonly port: number;
  private readonly failOnTimeout: boolean;
  private readonly timeoutOverride?: number;

  constructor(address: string, port: number) {
    this.timeoutOverride = 1000;
    this.failOnTimeout = false;
    this.address = address;
    this.port = port;
  }

  public async start(): Promise<void> {
    // nothing needed
  }

  public async getPowerState(): Promise<EpsonNetworkRS232Projector.PowerState> {
    const result = await this.writeCommand('PWR?');
    const m = result.toUpperCase().match(/PWR=(\d\d)/);
    if (!m) {
      debug(`unknown power state: ${result}`);
      return EpsonNetworkRS232Projector.PowerState.UNKNOWN;
    }
    switch (m[1]) {
      case '01':
      case '02':
        return EpsonNetworkRS232Projector.PowerState.ON;
      case '00':
        return EpsonNetworkRS232Projector.PowerState.OFF;
      default:
        debug(`unknown power state: ${result}`);
        return EpsonNetworkRS232Projector.PowerState.UNKNOWN;
    }
  }

  public async on(): Promise<void> {
    const powerState = await this.getPowerState();
    if (powerState === EpsonNetworkRS232Projector.PowerState.ON) {
      return;
    }
    await this.writeCommand('PWR ON', TIMEOUT_LONG);
  }

  public async off(): Promise<void> {
    await this.writeCommand('PWR OFF', TIMEOUT_LONG);
  }

  public async changeInput(input: EpsonNetworkRS232ProjectorClientInput): Promise<void> {
    let currentInput;
    try {
      currentInput = await this.getInput();
    } catch (err) {
      debug('could not get current input', err);
    }
    debug(`currentInput ${currentInput ? JSON.stringify(currentInput) : 'unknown'}`);
    if (currentInput && input === currentInput) {
      debug(`Skipping set source. source already set to: ${input}`);
      return;
    }
    await this.writeCommand(`SOURCE ${input.toString(16)}`);
  }

  public async buttonPress(button: EpsonNetworkRS232ProjectorClientButton): Promise<void> {
    await this.writeCommand(`KEY ${button.toString(16)}`);
  }

  public async getInput(): Promise<EpsonNetworkRS232ProjectorClientInput> {
    const result = await this.writeCommand('SOURCE?');
    const m = result.match(/SOURCE=(\d\d)/);
    if (m) {
      return parseInt(m[1], 16);
    } else {
      debug(`unknown input ${result}`);
      return (result as unknown) as EpsonNetworkRS232ProjectorClientInput;
    }
  }

  private async writeCommand(command: string, timeout?: number): Promise<string> {
    return this.writeData(`${command}\r\n`, timeout);
  }

  private async writeData(data: string, timeout?: number): Promise<string> {
    timeout = timeout || TIMEOUT_SHORT;
    if (this.timeoutOverride) {
      timeout = this.timeoutOverride;
    }

    debug(`send: ${data}`);
    const response = await axios.post(`http://${this.address}:${this.port}/send`, data, {
      timeout,
    });
    const responseData = response.data as string;
    debug(`recv: ${responseData}`);
    return responseData[responseData.length - 1];
  }
}
