#/bin/bash

npx hardhat run --network localhost ./scripts-abs/deploy_EntryPoint.js 
npx hardhat run --network localhost ./scripts-abs/deploy_AccountFactory.js 
npx hardhat run --network localhost ./scripts-abs/deploy_Paymaster.js 
npx hardhat run --network localhost ./scripts-abs/deploy_ExampleContract.js 
npx hardhat run --network localhost ./scripts-abs/deploy_ExampleContract2.js 
npx hardhat run --network localhost ./scripts-abs/getSenderAddress.js 
npx hardhat run --network localhost ./scripts-abs/depositFunds.js 