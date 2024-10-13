export enum EpsonNetworkRS232ProjectorClientInput {
  HDMI1 = 0x30, // 48
  HDMI2 = 0xa0, // 160
}

export function parseEpsonNetworkRS232ProjectorClientInput(a: any): EpsonNetworkRS232ProjectorClientInput {
  if (!a) {
    throw new Error('invalid input');
  }

  if (typeof a === 'number') {
    return a as EpsonNetworkRS232ProjectorClientInput;
  }

  if (a.toLowerCase) {
    const str = a.toLowerCase();
    if (str === 'hdmi1') {
      return EpsonNetworkRS232ProjectorClientInput.HDMI1;
    }
    if (str === 'hdmi2') {
      return EpsonNetworkRS232ProjectorClientInput.HDMI2;
    }
  }

  return parseInt(a, 16) as EpsonNetworkRS232ProjectorClientInput;
}

export function epsonNetworkRS232ProjectorClientInputToStatusString(
  input: EpsonNetworkRS232ProjectorClientInput | undefined,
): string {
  switch (input) {
    case EpsonNetworkRS232ProjectorClientInput.HDMI1:
      return 'HDMI1';
    case EpsonNetworkRS232ProjectorClientInput.HDMI2:
      return 'HDMI2';
    default:
      return 'unknown';
  }
}
