import { EpsonNetworkRS232ProjectorClientButton } from './EpsonNetworkRS232ProjectorClientButton';
import { EpsonNetworkRS232ProjectorClientInput } from './EpsonNetworkRS232ProjectorClientInput';
import { PowerStatus } from '@unisonht/unisonht';

export interface EpsonNetworkRS232ProjectorClient {
  start(): Promise<void>;

  on(): Promise<void>;

  off(): Promise<void>;

  changeInput(input: EpsonNetworkRS232ProjectorClientInput): Promise<void>;

  buttonPress(button: EpsonNetworkRS232ProjectorClientButton): Promise<void>;

  getInput(): Promise<EpsonNetworkRS232ProjectorClientInput>;

  getPowerState(): Promise<PowerStatus>;
}
