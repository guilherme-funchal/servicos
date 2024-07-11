const hre = require("hardhat");
const path = require('path');
const fs = require('fs');

async function main() {
  //const privateKey = process.env.PRIVATE_KEY;
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  console.log("--->", privateKey)
  //const name = process.env.NAME;
  const name = "teste"
  const newFilePath = path.join(__dirname, '../contracts', name+".sol");
  const { ethers } = hre;

  const wallet = new ethers.Wallet(privateKey, ethers.provider);
  
  console.log("Deploying contracts with the account:", wallet.address);
  const MyToken = await ethers.getContractFactory(name, wallet);
  const myToken = await MyToken.deploy();
  
  console.log("Contract nunber:", myToken.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
