import {
    DeviceStatus,
    NextFunction,
    RouteHandlerRequest,
    RouteHandlerResponse,
    UnisonHT,
    UnisonHTDevice
} from "@unisonht/unisonht";
import {EpsonNetworkRS232ProjectorClientImpl} from "./EpsonNetworkRS232ProjectorClientImpl";
import {EpsonNetworkRS232ProjectorClientMock} from "./EpsonNetworkRS232ProjectorClientMock";
import {EpsonNetworkRS232ProjectorClient} from "./EpsonNetworkRS232ProjectorClient";

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

    getDeviceName(): string {
        return this.deviceName;
    }

    async initialize(unisonht: UnisonHT): Promise<void> {
        unisonht.post(this, 'on', {
            handler: this.handleOn.bind(this)
        });
        unisonht.post(this, 'off', {
            handler: this.handleOff.bind(this)
        });
        unisonht.post(this, 'input/:input', {
            handler: this.handleChangeInput.bind(this)
        });
        await this.client.start();
    }

    async getStatus(): Promise<DeviceStatus> {
        const powerState = await this.client.getPowerState();
        const input = powerState === EpsonNetworkRS232Projector.PowerState.ON
            ? await this.client.getInput()
            : undefined;
        return {
            power: powerState,
            input: input
        }
    }

    async handleKeyPress(
        key: string,
        request: RouteHandlerRequest,
        response: RouteHandlerResponse,
        next: NextFunction
    ): Promise<void> {
        await this.client.buttonPress(key);
    }

    private async handleOn(
        request: RouteHandlerRequest,
        response: RouteHandlerResponse,
        next: NextFunction
    ): Promise<void> {
        await this.client.on();
        response.send();
    }

    private async handleOff(
        request: RouteHandlerRequest,
        response: RouteHandlerResponse,
        next: NextFunction
    ): Promise<void> {
        await this.client.off();
        response.send();
    }

    private async handleChangeInput(
        request: RouteHandlerRequest,
        response: RouteHandlerResponse,
        next: NextFunction
    ): Promise<void> {
        const input = request.parameters['input'];
        await this.client.changeInput(input);
    }
}

export module EpsonNetworkRS232Projector {
    export enum PowerState {
        ON = 'ON',
        OFF = 'OFF',
        UNKNOWN = 'UNKNOWN'
    }

    export enum Input {
        HDMI1 = 0x30,
        HDMI2 = 0xA0
    }
}
