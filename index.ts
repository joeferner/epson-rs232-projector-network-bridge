import {Device, UnisonHT, UnisonHTResponse} from "unisonht";
import * as express from "express";
import {EpsonNetworkRS232ProjectorClientImpl} from "./EpsonNetworkRS232ProjectorClientImpl";
import {MockEpsonNetworkRS232ProjectorClient} from "./MockEpsonNetworkRS232ProjectorClient";
import {EpsonNetworkRS232ProjectorClient} from "./EpsonNetworkRS232ProjectorClient";

export class EpsonNetworkRS232Projector extends Device {
  private client: EpsonNetworkRS232ProjectorClient;

  constructor(deviceName: string, options: EpsonNetworkRS232Projector.Options) {
    super(deviceName, options);
    options.inputMapping = options.inputMapping || {};
    this.client = process.env.NODE_ENV === 'development'
      ? new MockEpsonNetworkRS232ProjectorClient()
      : new EpsonNetworkRS232ProjectorClientImpl(options.address, options.port || 23);
  }

  start(unisonht: UnisonHT): Promise<void> {
    return super.start(unisonht)
      .then(() => {
        unisonht.getApp().post(`${this.getPathPrefix()}/on`, this.handleOn.bind(this));
        unisonht.getApp().post(`${this.getPathPrefix()}/off`, this.handleOff.bind(this));
        unisonht.getApp().post(`${this.getPathPrefix()}/input`, this.handleChangeInput.bind(this));
        return this.client.start();
      })
  }

  getStatus(): Promise<Device.Status> {
    return this.client.getPowerState()
      .then(powerState => {
        const inputPromise: Promise<EpsonNetworkRS232Projector.Input> = powerState === Device.PowerState.ON
          ? this.client.getInput()
          : Promise.resolve({});
        return inputPromise
          .then((input) => {
            if (input && input.deviceInput) {
              input.mappedInput = this.getOptions().inputMapping[input.deviceInput.toUpperCase()];
            }
            return {
              power: powerState,
              input: input
            }
          });
      });
  }

  private handleOn(req: express.Request, res: UnisonHTResponse, next: express.NextFunction): void {
    res.promiseNoContent(this.client.on());
  }

  private handleOff(req: express.Request, res: UnisonHTResponse, next: express.NextFunction): void {
    res.promiseNoContent(this.client.off());
  }

  protected handleButtonPress(req: express.Request, res: UnisonHTResponse, next: express.NextFunction): void {
    const buttonName = req.query.button;
    res.promiseNoContent(this.client.buttonPress(buttonName));
  }

  private handleChangeInput(req: express.Request, res: UnisonHTResponse, next: express.NextFunction): void {
    let input = req.query.input;
    const newInput = this.getOptions().inputMapping[input];
    if (newInput) {
      input = newInput;
    }
    res.promiseNoContent(this.client.changeInput(input));
  }

  public getOptions(): EpsonNetworkRS232Projector.Options {
    return <EpsonNetworkRS232Projector.Options>super.getOptions();
  }
}

export module EpsonNetworkRS232Projector {
  export interface Options extends Device.Options {
    address: string;
    port?: number;
    inputMapping?: {
      [deviceInputName: string]: string;
    }
  }

  export interface Input {
    deviceInput: string;
    mappedInput?: string;
    rawCode?: string;
  }

  export class Inputs {
    static get HDMI1() {
      return 'HDMI1';
    }
  }
}
