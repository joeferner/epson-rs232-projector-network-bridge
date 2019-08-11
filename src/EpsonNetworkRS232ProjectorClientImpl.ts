import { EpsonNetworkRS232ProjectorClient } from './EpsonNetworkRS232ProjectorClient';
import { EpsonNetworkRS232Projector } from './index';
import axios from 'axios';
import Debug from 'debug';
import { EpsonNetworkRS232ProjectorClientButton } from './EpsonNetworkRS232ProjectorClientButton';
import { EpsonNetworkRS232ProjectorClientInput } from './EpsonNetworkRS232ProjectorClientInput';

const debug = Debug('EpsonNetworkRS232Projector:ClientImpl');

const TIMEOUT_SHORT = 3 * 1000;

export class EpsonNetworkRS232ProjectorClientImpl implements EpsonNetworkRS232ProjectorClient {
  private readonly address: string;
  private readonly port: number;
  private readonly failOnTimeout: boolean;
  private readonly timeoutOverride?: number;

  constructor(address: string, port: number) {
    this.failOnTimeout = false;
    this.address = address;
    this.port = port;
  }

  public async start(): Promise<void> {
    // nothing needed
  }

  public async getPowerState(): Promise<EpsonNetworkRS232Projector.PowerState> {
    const result = await this.writeCommand('PWR?');
    if (!result) {
      throw new Error('Failed to query source. Results were empty.');
    }
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
    await this.setPower(EpsonNetworkRS232Projector.PowerState.ON, 'PWR ON');
  }

  public async off(): Promise<void> {
    await this.setPower(EpsonNetworkRS232Projector.PowerState.OFF, 'PWR OFF');
  }

  private async setPower(desiredState: EpsonNetworkRS232Projector.PowerState, command: string): Promise<void> {
    const retries = 10;
    for (let retryCount = 0; retryCount < retries; retryCount++) {
      try {
        const powerState = await this.getPowerState();
        if (powerState === desiredState) {
          return;
        }
        await this.writeCommand(command, TIMEOUT_SHORT, false);
        await this.sleep(TIMEOUT_SHORT);
      } catch (err) {
        console.error('failed to set power state', err);
        if (retryCount === retries - 1) {
          throw err;
        }
      }
    }
  }

  public async changeInput(input: EpsonNetworkRS232ProjectorClientInput): Promise<void> {
    for (let retryCount = 0; retryCount < 3; retryCount++) {
      const currentInput = await this.getInput();
      if (currentInput === input) {
        return;
      }
      await this.writeCommand(`SOURCE ${input.toString(16)}`, TIMEOUT_SHORT, false);
      await this.sleep(TIMEOUT_SHORT);
    }
    throw new Error('failed to set input');
  }

  private sleep(time: number): Promise<void> {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  public async buttonPress(button: EpsonNetworkRS232ProjectorClientButton): Promise<void> {
    await this.writeCommand(`KEY ${button.toString(16)}`);
  }

  public async getInput(): Promise<EpsonNetworkRS232ProjectorClientInput> {
    const result = await this.writeCommand('SOURCE?');
    if (!result) {
      throw new Error('Failed to query source. Results were empty.');
    }
    const m = result.match(/SOURCE=([0-9a-fA-F]+)/);
    if (m) {
      return parseInt(m[1], 16);
    } else {
      debug(`unknown input ${result}`);
      return (result as unknown) as EpsonNetworkRS232ProjectorClientInput;
    }
  }

  private async writeCommand(
    command: string,
    timeout?: number,
    waitForResponse?: boolean,
  ): Promise<string | undefined> {
    const retryCount = 2;
    for (let i = 0; i < retryCount; i++) {
      try {
        const result = await this.writeData(`${command}\r\n`, timeout, waitForResponse);
        if (result === undefined) {
          return;
        }
        for (const resultItem of result) {
          if (resultItem.indexOf('ERR') >= 0) {
            throw new Error(`Error received: ${result}`);
          }
        }
        return result[result.length - 1];
      } catch (err) {
        if (i + 1 === retryCount) {
          throw err;
        }
        console.error(`failed to write command: ${command}. retying`, err);
      }
    }
  }

  private async writeData(data: string, timeout?: number, waitForResponse?: boolean): Promise<string[] | undefined> {
    timeout = timeout || TIMEOUT_SHORT;
    debug(`send: ${data.trim()}`);
    const response = await axios.post(
      `http://${this.address}:${this.port}/send`,
      {
        value: data,
        waitForResponse: waitForResponse !== undefined ? waitForResponse : true,
        timeout,
      },
      { timeout },
    );
    const responseData = response.data as string[];
    debug(`recv: %o`, responseData);
    return responseData;
  }
}
