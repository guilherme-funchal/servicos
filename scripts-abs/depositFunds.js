const hre = require("hardhat");
require('dotenv').config();

const { entryPointAddress, eoaPublicKey, paymasterAddress } = require('../addressesConfig');

async function main() {

    // Create a wallet instance with the private key
    const wallet = new ethers.Wallet(process.env.PRI_KEY);

    // Connect the wallet to the Hardhat network provider
    const signer = wallet.connect(hre.ethers.provider);
    const entryPoint = await hre.ethers.getContractAt("EntryPoint", entryPointAddress, signer);
    const sendFunds = await entryPoint.depositTo(paymasterAddress, {
        value: hre.ethers.parseUnits("5000000", "gwei"),
    });
    await sendFunds.wait();
    const tx = {
        to: eoaPublicKey,
        value: hre.ethers.parseUnits("5000000", "gwei")
    };
   
    const transactionResponse = await signer.sendTransaction(tx);
    await transactionResponse.wait();
    
console.log('deposit successful');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
