const hre = require("hardhat");
const { Web3 } = require('web3');
const { ethers } = require("ethers");
const { exampleContractAddress, simpleAccountAddress } = require('../addressesConfig');
const web3 = new Web3();

async function main() {

    const exampleContract = await hre.ethers.getContractAt("exampleContract", exampleContractAddress);

    const tokenId = await exampleContract.tokenId();

    console.log("simpleAccountAddress:", simpleAccountAddress);

    if (simpleAccountAddress.length === 42 && web3.utils.isAddress(simpleAccountAddress)) {
      const checksumAddress = web3.utils.toChecksumAddress(simpleAccountAddress);
      //console.log('Checksum Address:', checksumAddress);,
      console.log("tokenId:", tokenId);
      const balance = await exampleContract.balanceOf(simpleAccountAddress)
      console.log("balance:", balance);
  } else {
      console.error('Endereço inválido:', simpleAccountAddress);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

