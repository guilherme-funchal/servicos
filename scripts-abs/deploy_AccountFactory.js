const hre = require("hardhat");
const { entryPointAddress } = require('../addressesConfig');
const { updateAddressesConfig } = require('./helpers/updateAddressesConfig');

async function main() {

  const AccountFactory = await hre.ethers.deployContract("AccountFactory",[entryPointAddress]);
  
  await AccountFactory.waitForDeployment();

  console.log(
    `AccountFactory deployed to ${AccountFactory.target}` 
  );

  updateAddressesConfig('accountFactoryAddress', AccountFactory.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
