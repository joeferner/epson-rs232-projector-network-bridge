import { UnisonHT, WebApi } from '@unisonht/unisonht';
import { EpsonNetworkRS232Projector } from '.';

const port = 3000;
const unisonht = new UnisonHT({});
unisonht.use(new WebApi({ port }));

unisonht.use(
  new EpsonNetworkRS232Projector('projector', {
    address: '192.168.0.161',
  }),
);

async function start() {
  await unisonht.start();
  console.log(`Listening http://localhost:${port}`);
}

start();
