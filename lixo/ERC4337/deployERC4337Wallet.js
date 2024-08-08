const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

const network = "http://127.0.0.1:8545";
const web3 = new Web3(
    new Web3.providers.HttpProvider(
        `${network}`
    )
);

// Configurações

const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff8';
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);

async function main() {
    console.log("Deploying contracts with the account:", account.address);

    // // Ler ABI e bytecode do artefato
    // const artifactPath = path.resolve(__dirname, '../artifacts', 'contracts/ERC4337Wallet.sol', 'ERC4337Wallet.json');
    // console.log("artifactPath", artifactPath);

    // const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // // Deploy do contrato
    // const contract = new web3.eth.Contract(artifact.abi);
    // const deployTx = contract.deploy({ data: artifact.bytecode });
    // const gas = await deployTx.estimateGas();

    // const result = await deployTx.send({ from: account.address, gas });

    // console.log('ERC4337Wallet deployed to:', result.options.address);
}

main().catch((error) => {
    console.error(error);
});
