// heliaSetup.js
const { createHelia } = require('helia');
const { createLibp2p } = require('libp2p');
const { tcp } = require('@libp2p/tcp');
const { mplex } = require('@libp2p/mplex');
const { noise } = require('@libp2p/noise');
const { create } = require('ipfs-http-client');

async function setupHelia() {
  // Configura libp2p
  const libp2p = await createLibp2p({
    transports: [tcp()],
    streamMuxers: [mplex()],
    connectionEncryption: [noise()]
  });

  // Inicializa Helia
  const helia = await createHelia({
    libp2p
  });

  // Conectando ao IPFS API (localhost:5001)
  const ipfs = create({
    host: '127.0.0.1',
    port: '5001',
    protocol: 'http'
  });

  return { helia, ipfs };
}

module.exports = setupHelia;
