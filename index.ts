import {UnisonHT, UnisonHTDevice, DeviceInput} from "unisonht";
import * as dgram from "dgram";
import createLogger from "unisonht/lib/Log";

const log = createLogger('epsonNetworkRS232Projector');

class EpsonNetworkRS232Projector implements UnisonHTDevice {
  private options: EpsonNetworkRS232Projector.Options;

  constructor(options: EpsonNetworkRS232Projector.Options) {
    this.options = options;
    this.options.port = this.options.port || 9000;
  }

  getName(): string {
    return this.options.name;
  }
  
  ensureOn(): Promise<void> {
    return this.getPowerState()
      .then((on) => {
        if (on) {
          return Promise.resolve();
        }
        return this.writeCommand('PWR ON')
          .catch((err) => {
            log.error('could not power on first try. Trying again', err);
            return this.writeCommand('PWR ON');
          });
      });
  }

  ensureOff(): Promise<void> {
    return this.writeCommand('PWR OFF');
  }

  buttonPress(button: string): Promise<void> {
    const keyCode = EpsonNetworkRS232Projector.toKeyCode(button);
    if (!keyCode) {
      return Promise.reject(`Could not convert to key code: ${button}`);
    }
    return this.writeCommand(`KEY ${keyCode.toString(16)}`);
  }

  changeInput(input: string): Promise<void> {
    const newInput = this.options.inputs[input];
    if (newInput) {
      input = newInput;
    }

    const sourceCode = EpsonNetworkRS232Projector.toSourceCode(input);
    if (!sourceCode) {
      return Promise.reject(`Invalid source: ${input}`);
    }
    const sourceCodeHex = sourceCode.toString(16);

    return this.getInput()
      .then((currentInput) => {
        if (sourceCodeHex.toLowerCase() == currentInput.rawCode.toLowerCase()) {
          log.debug(`Skipping set source. source already set to: ${sourceCodeHex}`);
          return;
        }
        return this.writeCommand(`SOURCE ${sourceCodeHex}`);
      });
  }

  private writeCommand(command: string): Promise<string> {
    return this.writeData(`${command}\r\n`);
  }

  getPowerState(): Promise<EpsonNetworkRS232Projector.PowerState> {
    return this.writeCommand('PWR?')
      .then((result) => {
        switch (result.toUpperCase()) {
          case 'PWR=01':
          case 'PWR=02':
            return EpsonNetworkRS232Projector.PowerState.ON;
          case 'PWR=00':
            return EpsonNetworkRS232Projector.PowerState.OFF;
          default:
            return EpsonNetworkRS232Projector.PowerState.UNKNOWN;
        }
      });
  }

  private getInput(): Promise<EpsonNetworkRS232Projector.Input> {
    return this.writeCommand('SOURCE?')
      .then((result) => {
        if (result.startsWith('SOURCE=')) {
          return {
            rawCode: this.fromSourceCode(result.substr('SOURCE='.length))
          }
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
    var input;
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
      mappedInput: this.options.inputs[input.toUpperCase()]
    };
  }

  private writeData(data: string): Promise<string> {
    return new Promise((resolve, reject)=> {
      const client = dgram.createSocket('udp4');
      client.on('message', (data) => {
        log.debug(`receive: ${data}`);
        client.close();
        resolve(data);
      });
      log.debug(`writing data: ${data.trim()}`);
      client.send(data, this.options.port, this.options.address, (err) => {
        if (err) {
          client.close();
          return reject(err);
        }
        setTimeout(()=> {
          client.close();
          return reject(new Error('timeout waiting for data'));
        }, 1000);
      });
    });
  }
}

module EpsonNetworkRS232Projector {
  export interface Options {
    name: string;
    address: string;
    port?: number;
    inputs: {
      [deviceInputName: string]: string;
    }
  }

  export interface Input extends DeviceInput {
    rawCode: string;
  }

  export class Inputs {
    static get HDMI1() {
      return 'HDMI1';
    }
  }

  export enum PowerState {
    ON,
    OFF,
    UNKNOWN
  }
}

export default EpsonNetworkRS232Projector;
