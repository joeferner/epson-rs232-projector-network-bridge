import {UnisonHT} from "@unisonht/unisonht";
import {EpsonNetworkRS232Projector} from ".";

const unisonht = new UnisonHT({});

unisonht.use(new EpsonNetworkRS232Projector('projector', {
    address: '192.168.0.101'
}));

unisonht.listen(3000);
