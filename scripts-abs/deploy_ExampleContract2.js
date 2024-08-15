const hre = require("hardhat");
const { updateAddressesConfig } = require('./helpers/updateAddressesConfig');

async function main() {
  // Compile the contracts if they haven't been compiled yet
  await hre.run('compile');

  // We get the contract to deploy
  const ExampleContract2 = await hre.ethers.getContractFactory("exampleContract2");
  const exampleContract2 = await ExampleContract2.deploy("Example Token", "EXT");

  await exampleContract2.waitForDeployment();

  console.log("Contract deployed to address:", exampleContract2.target);
  updateAddressesConfig('exampleContractAddress2', exampleContract2.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
