import {Device, UnisonHT, PromiseResponderResponse} from "unisonht";
import * as express from "express";
import * as dgram from "dgram";
import * as HttpStatusCodes from "http-status-codes";
import * as Boom from "boom";

export class EpsonNetworkRS232Projector extends Device {
  private options: EpsonNetworkRS232Projector.Options;
  private client: dgram.Socket;

  constructor(deviceName: string, options: EpsonNetworkRS232Projector.Options) {
    super(deviceName);
    this.options = options;
    this.options.port = this.options.port || 9000;

    this.client = dgram.createSocket('udp4');
    this.client.bind(this.options.port);
  }

  start(unisonht: UnisonHT): Promise<void> {
    return super.start(unisonht)
      .then(() => {
        unisonht.getApp().post(`${this.getPathPrefix()}/on`, this.handleOn.bind(this));
        unisonht.getApp().post(`${this.getPathPrefix()}/off`, this.handleOff.bind(this));
        unisonht.getApp().post(`${this.getPathPrefix()}/input`, this.handleChangeInput.bind(this));
      });
  }

  getStatus(): Promise<Device.Status> {
    return this.getPowerState()
      .then(powerState => {
        return this.getInput()
          .then((input) => {
            return {
              power: powerState,
              input: input
            }
          });
      });
  }

  private handleOn(req: express.Request, res: express.Response, next: express.NextFunction): void {
    this.getPowerState()
      .then((powerState): Promise<void> => {
        if (powerState == Device.PowerState.ON) {
          res.status(HttpStatusCodes.NOT_MODIFIED).send();
          return;
        }
        this.writeCommand('PWR ON')
          .then(() => {
            res.status(HttpStatusCodes.NO_CONTENT).send();
          })
          .catch((err) => {
            this.log.warn('could not power on first try. Trying again', err);
            (<PromiseResponderResponse>res).promiseNoContent(this.writeCommand('PWR ON'));
          });
      });
  }

  private handleOff(req: express.Request, res: express.Response, next: express.NextFunction): void {
    (<PromiseResponderResponse>res).promiseNoContent(this.writeCommand('PWR OFF'));
  }

  protected handleButtonPress(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const buttonName = req.query.button;
    const keyCode = EpsonNetworkRS232Projector.toKeyCode(buttonName);
    if (!keyCode) {
      next(Boom.badRequest(`Could not convert to key code: ${buttonName}`));
      return;
    }
    (<PromiseResponderResponse>res).promiseNoContent(this.writeCommand(`KEY ${keyCode.toString(16)}`));
  }

  private handleChangeInput(req: express.Request, res: express.Response, next: express.NextFunction): void {
    let input = req.query.input;
    const newInput = this.options.inputMapping[input];
    if (newInput) {
      input = newInput;
    }

    const sourceCode = EpsonNetworkRS232Projector.toSourceCode(input);
    if (!sourceCode) {
      next(Boom.badRequest(`Invalid source: ${input}`));
      return;
    }
    const sourceCodeHex = sourceCode.toString(16);

    this.getInput()
      .then((currentInput) => {
        this.log.debug(`currentInput ${JSON.stringify(currentInput)}`);
        if (sourceCodeHex.toLowerCase() == currentInput.rawCode.toLowerCase()) {
          this.log.debug(`Skipping set source. source already set to: ${sourceCodeHex}`);
          res.status(HttpStatusCodes.NOT_MODIFIED).send();
          return;
        }
        (<PromiseResponderResponse>res).promiseNoContent(this.writeCommand(`SOURCE ${sourceCodeHex}`));
      })
      .catch((err) => {
        this.log.warn('could not get current input', err);
        (<PromiseResponderResponse>res).promiseNoContent(this.writeCommand(`SOURCE ${sourceCodeHex}`));
      });
  }

  private writeCommand(command: string): Promise<string> {
    return this.writeData(`${command}\r\n`);
  }

  private getPowerState(): Promise<Device.PowerState> {
    return this.writeCommand('PWR?')
      .then((result) => {
        const m = result.toUpperCase().match(/PWR=(\d\d)/);
        if (!m) {
          return null;
        }
        switch (m[1]) {
          case '01':
          case '02':
            return Device.PowerState.ON;
          case '00':
            return Device.PowerState.OFF;
          default:
            return null;
        }
      })
      .catch((err) => {
        this.log.warn('Could not get power state', err);
        return null;
      });
  }

  private getInput(): Promise<EpsonNetworkRS232Projector.Input> {
    return this.writeCommand('SOURCE?')
      .then((result) => {
        const m = result.match(/SOURCE=(\d\d)/);
        if (m) {
          return this.fromSourceCode(m[1]);
        } else {
          return {
            rawCode: result
          };
        }
      });
  }

  private static toSourceCode(input: string): number {
    switch (input.toLowerCase()) {
      case "hdmi1":
        return 0x30;
      case "hdmi2":
        return 0xA0;
      default:
        return null;
    }
  }

  private static toKeyCode(button: string): number {
    switch (button.toLowerCase()) {
      case "power":
        return 0x01;
      case "menu":
        return 0x03;
      case "esc":
        return 0x05;
      case "enter":
        return 0x16;
      case "up":
        return 0x35;
      case "down":
        return 0x36;
      case "left":
        return 0x37;
      case "right":
        return 0x38;
      case "source":
        return 0x48;
      default:
        return null;
    }
  }

  private fromSourceCode(sourceCode: string): EpsonNetworkRS232Projector.Input {
    let input;
    switch (sourceCode.toLowerCase()) {
      case "30":
        input = "hdmi1";
        break;
      case "a0":
        input = "hdmi2";
        break;
      default:
        return {
          rawCode: sourceCode,
          deviceInput: sourceCode,
          mappedInput: null
        };
    }

    return {
      rawCode: sourceCode,
      deviceInput: input,
      mappedInput: this.options.inputMapping[input.toUpperCase()]
    };
  }

  private writeData(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.once('message', (data) => {
        this.log.debug(`receive: ${data}`);
        resolve(data.toString());
      });
      this.log.debug(`writing data: ${data.trim()}`);
      this.client.send(data, this.options.port, this.options.address, (err) => {
        if (err) {
          return reject(err);
        }
        setTimeout(() => {
          return reject(new Error('timeout waiting for data'));
        }, 1000);
      });
    });
  }
}

export module EpsonNetworkRS232Projector {
  export interface Options {
    address: string;
    port?: number;
    inputMapping?: {
      [deviceInputName: string]: string;
    }
  }

  export interface Input {
    deviceInput: string;
    mappedInput: string;
    rawCode: string;
  }
}
