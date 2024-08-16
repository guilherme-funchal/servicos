const hre = require("hardhat");
const path = require('path');
const fs = require('fs');

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const name = process.env.NAME;

  const newFilePath = path.join(__dirname, '../contracts', name+".sol");
  const wallet = new ethers.Wallet(privateKey, ethers.provider);

  console.log("Deploying contracts with the account:", wallet.address);
  const MyToken = await ethers.getContractFactory(name, wallet);
  const myToken = await MyToken.deploy(wallet);

  console.log("Contract nunber:", myToken.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  

 