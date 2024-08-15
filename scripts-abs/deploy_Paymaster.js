
const hre = require("hardhat");
const { entryPointAddress, accountFactoryAddress } = require('../addressesConfig');
const { updateAddressesConfig } = require('./helpers/updateAddressesConfig');

async function main() {

  const Paymaster = await hre.ethers.deployContract("Paymaster",[entryPointAddress, accountFactoryAddress]);

  await Paymaster.waitForDeployment();

  console.log(
    `Paymaster deployed to ${Paymaster.target}`
  );

  updateAddressesConfig('paymasterAddress', Paymaster.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
