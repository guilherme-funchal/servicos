const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Configuração do Web3
const network = "http://127.0.0.1:8545";

const web3 = new Web3(
    new Web3.providers.HttpProvider(
        `${network}`
    )
);

// Nome dos contratos
const entryPointName = 'ERC4337EntryPoint';
const walletAbstractionName = 'MyERC4337';

// Caminho para os arquivos ABI e bytecode dos contratos
const entryPointPath = path.join(__dirname, `../artifacts/contracts/${entryPointName}.sol/${entryPointName}.json`);
const walletAbstractionPath = path.join(__dirname, `../artifacts/contracts/${walletAbstractionName}.sol/${walletAbstractionName}.json`);

// Verifique se os arquivos realmente existem
if (!fs.existsSync(entryPointPath)) {
    console.error(`Arquivo não encontrado: ${entryPointPath}`);
    process.exit(1); // Sai do processo com um código de erro
}

if (!fs.existsSync(walletAbstractionPath)) {
    console.error(`Arquivo não encontrado: ${walletAbstractionPath}`);
    process.exit(1); // Sai do processo com um código de erro
}

// Carregar ABI e bytecode dos contratos
const entryPointJson = JSON.parse(fs.readFileSync(entryPointPath));
const entryPointAbi = entryPointJson.abi;
const entryPointBytecode = entryPointJson.bytecode;

const walletAbstractionJson = JSON.parse(fs.readFileSync(walletAbstractionPath));
const walletAbstractionAbi = walletAbstractionJson.abi;
const walletAbstractionBytecode = walletAbstractionJson.bytecode;

(async () => {
    const accounts = await web3.eth.getAccounts();

    // Verificar se o contrato EntryPoint já está implantado
    let entryPointAddress;
    // Se você já tem o endereço do EntryPoint, substitua o valor abaixo
    // entryPointAddress = '0xYourEntryPointAddress'; // Substitua pelo endereço real
    // Se não, implemente o EntryPoint primeiro
    const entryPointContract = new web3.eth.Contract(entryPointAbi);
    const entryPoint = await entryPointContract.deploy({ data: entryPointBytecode })
        .send({ from: accounts[0], gas: '2000000' });

    entryPointAddress = entryPoint.options.address;
    console.log('EntryPoint deployed at:', entryPointAddress);

    // Implantação do contrato WalletAbstraction, passando o endereço do EntryPoint
    const walletAbstractionContract = new web3.eth.Contract(walletAbstractionAbi);
    const walletAbstraction = await walletAbstractionContract.deploy({
        data: walletAbstractionBytecode,
        arguments: [entryPointAddress] // Passa o endereço do EntryPoint para o WalletAbstraction
    }).send({ from: accounts[0], gas: '2000000' });

    console.log('WalletAbstraction deployed at:', walletAbstraction.options.address);
})();

