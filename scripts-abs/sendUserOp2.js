const hre = require("hardhat");
require('dotenv').config();
const { priorityFeePerGas } = require('./helpers/gasEstimator');
const { eoaPublicKey, 
        eoaPrivateKey, 
        simpleAccountAddress, 
        entryPointAddress, 
        exampleContractAddress2, 
        accountFactoryAddress, 
        paymasterAddress } = require('../addressesConfig');

async function main() {

    const wallet = new ethers.Wallet(eoaPrivateKey);
    const signer = wallet.connect(hre.ethers.provider);

    const AccountFactory = await hre.ethers.getContractAt("AccountFactory", accountFactoryAddress, signer);
    const entryPoint = await hre.ethers.getContractAt("EntryPoint", entryPointAddress, signer);
    const simpleAccount = await hre.ethers.getContractAt("SimpleAccount", simpleAccountAddress, signer);
    const exampleContract = await hre.ethers.getContractAt("exampleContract2", exampleContractAddress2, signer);
    const mintAmount = "10000000000000000000"
    const balanceWei = await hre.ethers.provider.getBalance(signer.address);
    console.log(`The balance of the signer is: ${balanceWei} Wei`);

    const funcTargetData = exampleContract.interface.encodeFunctionData('mint', [simpleAccountAddress, mintAmount]);

    const data = simpleAccount.interface.encodeFunctionData('execute', [exampleContractAddress2, 0, funcTargetData]);

    let initCode = accountFactoryAddress + AccountFactory.interface.encodeFunctionData('createAccount', [eoaPublicKey, 0]).slice(2);

    const code = await hre.ethers.provider.getCode(simpleAccountAddress);
    console.log("code->", code);
    
    if (code !== '0x') {
        initCode = '0x'
    }

    console.log('maxPriorityFeePerGas:', await priorityFeePerGas());
    const nonce = await entryPoint.getNonce(simpleAccountAddress, 0);
    console.log('nonce:', nonce);

    const userOp = {
        sender: simpleAccountAddress,
        nonce: await entryPoint.getNonce(simpleAccountAddress, 0),
        initCode: initCode,
        callData: data,
        callGasLimit: '100000',
        verificationGasLimit: '1000000',
        preVerificationGas: '0x10edc8',
        maxFeePerGas: '0x0973e0',
        maxPriorityFeePerGas: await priorityFeePerGas(),
        paymasterAndData: paymasterAddress,
        signature: '0x'
    };

    //console.log(userOp);

    const hash = await entryPoint.getUserOpHash(userOp);
    console.log("----->", hash);

    userOp.signature = await signer.signMessage(hre.ethers.getBytes(hash));
    console.log("----->", hash);
    console.log("----->", userOp);


    try {
        const tx = await entryPoint.handleOps([userOp], eoaPublicKey, {
            gasLimit: 2000000
        });
        const receipt = await tx.wait();
        console.log('Transaction successful');
        //console.log('Transaction successful', receipt);
    } catch (error) {
        console.error('Error sending transaction:', error);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
