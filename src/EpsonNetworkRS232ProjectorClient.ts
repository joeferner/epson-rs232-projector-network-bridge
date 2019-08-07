import {EpsonNetworkRS232Projector} from "./index";

export interface EpsonNetworkRS232ProjectorClient {
    start(): Promise<void>;

    on(): Promise<void>;

    off(): Promise<void>;

    changeInput(input: EpsonNetworkRS232Projector.Input): Promise<void>;

    buttonPress(buttonName: string): Promise<void>;

    getInput(): Promise<EpsonNetworkRS232Projector.Input>;

    getPowerState(): Promise<EpsonNetworkRS232Projector.PowerState>;
}
