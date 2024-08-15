
const hre = require("hardhat");
const { updateAddressesConfig } = require('./helpers/updateAddressesConfig');

async function main() {

  const exampleContract = await hre.ethers.deployContract("exampleContract");

  await exampleContract.waitForDeployment();

  console.log(
    `example contract deployed to ${exampleContract.target}`
  );

  updateAddressesConfig('exampleContractAddress', exampleContract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
