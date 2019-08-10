import { UnisonHT, WebApi } from '@unisonht/unisonht';
import { EpsonNetworkRS232Projector } from '.';

const unisonht = new UnisonHT({});
unisonht.use(new WebApi({ port: 3000 }));

unisonht.use(
  new EpsonNetworkRS232Projector('projector', {
    address: '192.168.0.101',
  }),
);

unisonht.start();
