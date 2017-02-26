import {UnisonHT} from "unisonht";
import {EpsonNetworkRS232Projector} from ".";

const unisonht = new UnisonHT();

unisonht.use(new EpsonNetworkRS232Projector('projector', {
  address: '192.168.1.100'
}));

unisonht.listen(3000);
