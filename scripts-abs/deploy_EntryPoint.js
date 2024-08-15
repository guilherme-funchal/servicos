
const hre = require("hardhat");
const { updateAddressesConfig } = require('./helpers/updateAddressesConfig');

async function main() {

  const entryPoint = await hre.ethers.deployContract("EntryPoint");

  await entryPoint.waitForDeployment();

  console.log(
    `EntryPoint deployed to ${entryPoint.target}`
  );

  updateAddressesConfig('entryPointAddress', entryPoint.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
