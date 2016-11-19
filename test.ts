const repl = require('repl');
const EpsonNetworkRS232Projector = require('.').default;
var projector = new EpsonNetworkRS232Projector({
  address: '192.168.0.170'
});

console.log('projector exported');
const r = repl.start('> ');
r.context.projector = projector;
