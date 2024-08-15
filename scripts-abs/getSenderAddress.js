const hre = require("hardhat");
const { accountFactoryAddress, entryPointAddress } = require('../addressesConfig');
const { createEOA } = require('./helpers/createEoaWallet');
const { updateAddressesConfig } = require('./helpers/updateAddressesConfig');

async function main() {

  const AccountFactory = await hre.ethers.getContractAt("AccountFactory", accountFactoryAddress);

  const EOA = createEOA();

  const entryPoint = await hre.ethers.getContractAt("EntryPoint", entryPointAddress);
  console.log("EOA[0]->", EOA[0])
  console.log("accountFactoryAddress ", accountFactoryAddress)
  const initCode = accountFactoryAddress + AccountFactory.interface.encodeFunctionData('createAccount', [EOA[0], 0]).slice(2);
  console.log("initCode", initCode)

  let simpleAccountAddress;
  try {
    const result = await entryPoint.getSenderAddress(initCode);
    
  } catch (transaction) {

    console.log("transaction->", transaction.message.split('return data: ')[1]);

    if (transaction.data && typeof transaction.data === 'string') {
      console.log("1")
      simpleAccountAddress = '0x' + transaction.data.slice(-41);
    } else if (transaction.message && transaction.message.includes('return data:')) {
      const returnData = transaction.message.split('return data: ')[1];
      simpleAccountAddress = '0x' + returnData.slice(-41);
      simpleAccountAddress = simpleAccountAddress.replace(")", "");
    } else {
      console.error("O objeto transaction não contém um campo data ou uma mensagem reconhecível.");
      return;
    }
  }
  console.log('simpleAccountAddress:', simpleAccountAddress);

  updateAddressesConfig('eoaPublicKey', EOA[0]);
  updateAddressesConfig('eoaPrivateKey', EOA[1]);
  updateAddressesConfig('simpleAccountAddress', simpleAccountAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

