import {EpsonNetworkRS232Projector} from "./index";
import {Device} from "unisonht";

export interface EpsonNetworkRS232ProjectorClient {
  start(): Promise<void>;
  on(): Promise<void>;
  off(): Promise<void>;
  changeInput(newInput: string): Promise<void>;
  buttonPress(buttonName: string): Promise<void>;
  getInput(): Promise<EpsonNetworkRS232Projector.Input>;
  getPowerState(): Promise<Device.PowerState>;
}