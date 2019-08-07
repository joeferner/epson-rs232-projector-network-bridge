import {EpsonNetworkRS232ProjectorClient} from "./EpsonNetworkRS232ProjectorClient";
import {EpsonNetworkRS232Projector} from "./index";
import Debug from 'debug';

const debug = Debug('EpsonNetworkRS232ProjectorClientMock');

export class EpsonNetworkRS232ProjectorClientMock implements EpsonNetworkRS232ProjectorClient {
    private input: EpsonNetworkRS232Projector.Input = EpsonNetworkRS232Projector.Input.HDMI1;
    private powerState: EpsonNetworkRS232Projector.PowerState = EpsonNetworkRS232Projector.PowerState.UNKNOWN;

    async start(): Promise<void> {
        debug('start');
    }

    async on(): Promise<void> {
        debug('on');
        this.powerState = EpsonNetworkRS232Projector.PowerState.ON;
    }

    async off(): Promise<void> {
        debug('off');
        this.powerState = EpsonNetworkRS232Projector.PowerState.OFF;
    }

    async changeInput(input: EpsonNetworkRS232Projector.Input): Promise<void> {
        debug(`changeInput ${input}`);
        this.input = input;
    }

    async buttonPress(buttonName: string): Promise<void> {
        debug(`buttonPress ${buttonName}`);
    }

    async getInput(): Promise<EpsonNetworkRS232Projector.Input> {
        return this.input;
    }

    async getPowerState(): Promise<EpsonNetworkRS232Projector.PowerState> {
        return this.powerState;
    }
}
