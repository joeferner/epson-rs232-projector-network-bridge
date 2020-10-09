import {
  DeviceStatus,
  RouteHandlerRequest,
  RouteHandlerResponse,
  StandardButton,
  SupportedButton,
  SupportedButtons,
  UnisonHT,
  UnisonHTDevice,
} from '@unisonht/unisonht';
import { EpsonNetworkRS232ProjectorClientImpl } from './EpsonNetworkRS232ProjectorClientImpl';
import { EpsonNetworkRS232ProjectorClientMock } from './EpsonNetworkRS232ProjectorClientMock';
import { EpsonNetworkRS232ProjectorClient } from './EpsonNetworkRS232ProjectorClient';
import { EpsonNetworkRS232ProjectorClientButton } from './EpsonNetworkRS232ProjectorClientButton';
import { EpsonNetworkRS232ProjectorClientInput } from './EpsonNetworkRS232ProjectorClientInput';
import { EpsonNetworkRS232ProjectorPowerState } from './EpsonNetworkRS232ProjectorPowerState';

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
    const input = powerState === EpsonNetworkRS232ProjectorPowerState.ON ? await this.client.getInput() : undefined;
    return {
      power: powerState,
      input,
    };
  }

  public getSupportedButtons(): SupportedButtons {
    return {
      [StandardButton.POWER_TOGGLE]: this.createButtonPress(
        'Power Toggle',
        EpsonNetworkRS232ProjectorClientButton.POWER,
      ),
      [StandardButton.MENU]: this.createButtonPress('Menu', EpsonNetworkRS232ProjectorClientButton.MENU),
      [StandardButton.ESC]: this.createButtonPress('ESC', EpsonNetworkRS232ProjectorClientButton.ESC),
      [StandardButton.ENTER]: this.createButtonPress('Enter', EpsonNetworkRS232ProjectorClientButton.ENTER),
      [StandardButton.UP]: this.createButtonPress('Up', EpsonNetworkRS232ProjectorClientButton.UP),
      [StandardButton.DOWN]: this.createButtonPress('Down', EpsonNetworkRS232ProjectorClientButton.DOWN),
      [StandardButton.LEFT]: this.createButtonPress('Left', EpsonNetworkRS232ProjectorClientButton.LEFT),
      [StandardButton.RIGHT]: this.createButtonPress('Right', EpsonNetworkRS232ProjectorClientButton.RIGHT),
      [StandardButton.INPUT_TOGGLE]: this.createButtonPress('Source', EpsonNetworkRS232ProjectorClientButton.SOURCE),
      [StandardButton.INPUT_HDMI1]: this.createInputButtonPress(
        'Input: HDMI1',
        EpsonNetworkRS232ProjectorClientInput.HDMI1,
      ),
      [StandardButton.INPUT_HDMI2]: this.createInputButtonPress(
        'Input: HDMI2',
        EpsonNetworkRS232ProjectorClientInput.HDMI2,
      ),
      [StandardButton.POWER_ON]: {
        name: 'Power On',
        handleButtonPress: async (
          button: string,
          request: RouteHandlerRequest,
          response: RouteHandlerResponse,
        ): Promise<void> => {
          await this.client.on();
          response.send();
        },
      },
      [StandardButton.POWER_OFF]: {
        name: 'Power Off',
        handleButtonPress: async (
          button: string,
          request: RouteHandlerRequest,
          response: RouteHandlerResponse,
        ): Promise<void> => {
          await this.client.off();
          response.send();
        },
      },
    };
  }

  private createInputButtonPress(name: string, input: EpsonNetworkRS232ProjectorClientInput): SupportedButton {
    return {
      name,
      handleButtonPress: async (
        button: string,
        request: RouteHandlerRequest,
        response: RouteHandlerResponse,
      ): Promise<void> => {
        await this.client.changeInput(input);
        response.send();
      },
    };
  }

  private createButtonPress(name: string, button: EpsonNetworkRS232ProjectorClientButton): SupportedButton {
    return {
      name,
      handleButtonPress: async (
        btn: string,
        request: RouteHandlerRequest,
        response: RouteHandlerResponse,
      ): Promise<void> => {
        await this.client.buttonPress(button);
        response.send();
      },
    };
  }

  private async handleOn(request: RouteHandlerRequest, response: RouteHandlerResponse): Promise<void> {
    await this.client.on();
    response.send();
  }

  private async handleOff(request: RouteHandlerRequest, response: RouteHandlerResponse): Promise<void> {
    await this.client.off();
    response.send();
  }

  private async handleChangeInput(request: RouteHandlerRequest, response: RouteHandlerResponse): Promise<void> {
    const input = parseInt(request.parameters.input, 16);
    await this.client.changeInput(input);
    response.send();
  }
}
