const { ethers } = require('ethers');

function createEOA() {
    // Create a wallet instance
    const wallet = ethers.Wallet.createRandom();

    // Display the EOA details
    console.log("eoaPublicKey: " + wallet.address);
    console.log("eoaPrivateKey: " + wallet.privateKey);

    // Return the private key
    return [wallet.address , wallet.privateKey];
}

module.exports = { createEOA };
