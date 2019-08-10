import {
  DeviceStatus,
  NextFunction,
  RouteHandlerRequest,
  RouteHandlerResponse,
  StandardKey,
  SupportedKey,
  SupportedKeys,
  UnisonHT,
  UnisonHTDevice,
} from '@unisonht/unisonht';
import { EpsonNetworkRS232ProjectorClientImpl } from './EpsonNetworkRS232ProjectorClientImpl';
import { EpsonNetworkRS232ProjectorClientMock } from './EpsonNetworkRS232ProjectorClientMock';
import { EpsonNetworkRS232ProjectorClient } from './EpsonNetworkRS232ProjectorClient';
import { EpsonNetworkRS232ProjectorClientButton } from './EpsonNetworkRS232ProjectorClientButton';
import { EpsonNetworkRS232ProjectorClientInput } from './EpsonNetworkRS232ProjectorClientInput';

export interface EpsonNetworkRS232ProjectorOptions {
  useMockClient?: boolean;
  address: string;
  port?: number;
}

export class EpsonNetworkRS232Projector implements UnisonHTDevice {
  private readonly client: EpsonNetworkRS232ProjectorClient;
  private readonly deviceName: string;

  constructor(deviceName: string, options: EpsonNetworkRS232ProjectorOptions) {
    this.deviceName = deviceName;
    this.client = options.useMockClient
      ? new EpsonNetworkRS232ProjectorClientMock()
      : new EpsonNetworkRS232ProjectorClientImpl(options.address, options.port || 8080);
  }

  public getDeviceName(): string {
    return this.deviceName;
  }

  public async initialize(unisonht: UnisonHT): Promise<void> {
    unisonht.post(this, 'on', {
      handler: this.handleOn.bind(this),
    });
    unisonht.post(this, 'off', {
      handler: this.handleOff.bind(this),
    });
    unisonht.post(this, 'input/:input', {
      handler: this.handleChangeInput.bind(this),
    });
    await this.client.start();
  }

  public async getStatus(): Promise<DeviceStatus> {
    const powerState = await this.client.getPowerState();
    const input = powerState === EpsonNetworkRS232Projector.PowerState.ON ? await this.client.getInput() : undefined;
    return {
      power: powerState,
      input,
    };
  }

  public getSupportedKeys(): SupportedKeys {
    return {
      [StandardKey.POWER_TOGGLE]: this.createButtonPress('Power Toggle', EpsonNetworkRS232ProjectorClientButton.POWER),
      [StandardKey.MENU]: this.createButtonPress('Menu', EpsonNetworkRS232ProjectorClientButton.MENU),
      [StandardKey.ESC]: this.createButtonPress('ESC', EpsonNetworkRS232ProjectorClientButton.ESC),
      [StandardKey.ENTER]: this.createButtonPress('Enter', EpsonNetworkRS232ProjectorClientButton.ENTER),
      [StandardKey.UP]: this.createButtonPress('Up', EpsonNetworkRS232ProjectorClientButton.UP),
      [StandardKey.DOWN]: this.createButtonPress('Down', EpsonNetworkRS232ProjectorClientButton.DOWN),
      [StandardKey.LEFT]: this.createButtonPress('Left', EpsonNetworkRS232ProjectorClientButton.LEFT),
      [StandardKey.RIGHT]: this.createButtonPress('Right', EpsonNetworkRS232ProjectorClientButton.RIGHT),
      [StandardKey.INPUT_TOGGLE]: this.createButtonPress('Source', EpsonNetworkRS232ProjectorClientButton.SOURCE),
      [StandardKey.INPUT_HDMI1]: this.createInputButtonPress(
        'Input: HDMI1',
        EpsonNetworkRS232ProjectorClientInput.HDMI1,
      ),
      [StandardKey.INPUT_HDMI2]: this.createInputButtonPress(
        'Input: HDMI2',
        EpsonNetworkRS232ProjectorClientInput.HDMI2,
      ),
      [StandardKey.POWER_ON]: {
        name: 'Power On',
        handleKeyPress: async (
          key: string,
          request: RouteHandlerRequest,
          response: RouteHandlerResponse,
          next: NextFunction,
        ): Promise<void> => {
          await this.client.on();
          response.send();
        },
      },
      [StandardKey.POWER_OFF]: {
        name: 'Power Off',
        handleKeyPress: async (
          key: string,
          request: RouteHandlerRequest,
          response: RouteHandlerResponse,
          next: NextFunction,
        ): Promise<void> => {
          await this.client.off();
          response.send();
        },
      },
    };
  }

  private createInputButtonPress(name: string, input: EpsonNetworkRS232ProjectorClientInput): SupportedKey {
    return {
      name,
      handleKeyPress: async (
        key: string,
        request: RouteHandlerRequest,
        response: RouteHandlerResponse,
        next: NextFunction,
      ): Promise<void> => {
        await this.client.changeInput(input);
        response.send();
      },
    };
  }

  private createButtonPress(name: string, button: EpsonNetworkRS232ProjectorClientButton): SupportedKey {
    return {
      name,
      handleKeyPress: async (
        key: string,
        request: RouteHandlerRequest,
        response: RouteHandlerResponse,
        next: NextFunction,
      ): Promise<void> => {
        await this.client.buttonPress(button);
        response.send();
      },
    };
  }

  private async handleOn(
    request: RouteHandlerRequest,
    response: RouteHandlerResponse,
    next: NextFunction,
  ): Promise<void> {
    await this.client.on();
    response.send();
  }

  private async handleOff(
    request: RouteHandlerRequest,
    response: RouteHandlerResponse,
    next: NextFunction,
  ): Promise<void> {
    await this.client.off();
    response.send();
  }

  private async handleChangeInput(
    request: RouteHandlerRequest,
    response: RouteHandlerResponse,
    next: NextFunction,
  ): Promise<void> {
    const input = request.parameters.input;
    await this.client.changeInput(input);
  }
}

export namespace EpsonNetworkRS232Projector {
  export enum PowerState {
    ON = 'ON',
    OFF = 'OFF',
    UNKNOWN = 'UNKNOWN',
  }
}
