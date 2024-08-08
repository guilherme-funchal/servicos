const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

const network = "http://127.0.0.1:8545";
const web3 = new Web3(
    new Web3.providers.HttpProvider(
        `${network}`
    )
);



// Função para obter a conta do deployer
const getDeployer = async () => {
    const accounts = await web3.eth.getAccounts();
    return accounts[0];
};

// Função para compilar o contrato
const compileContract = (contractName) => {
    const contractPath = path.resolve(__dirname, '../artifacts', 'contracts/' + `${contractName}.sol`, `${contractName}.json`);
    if (!fs.existsSync(contractPath)) {
        throw new Error(`Contract file not found at ${contractPath}`);
    }
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    if (!contractJson.bytecode) {
        throw new Error('Bytecode is missing in the contract JSON file.');
    }
    return contractJson;
};

// Função para implantar o contrato
const deployContract = async (contractName, constructorArgs = []) => {
    const deployer = await getDeployer();
    const contractJson = compileContract(contractName);
    const { abi, bytecode } = contractJson;

    // Verifica se o bytecode está correto
    if (!bytecode || !bytecode.startsWith('0x')) {
        throw new Error('Invalid bytecode.');
    }

    const contract = new web3.eth.Contract(abi);

    // Verificar se há argumentos para o construtor e passá-los
    const deployTx = contract.deploy({
        data: bytecode,
        arguments: constructorArgs, // Passa os argumentos do construtor aqui
    });

    try {
        const deployedContract = await deployTx.send({
            from: deployer,
            gas: '5000000',
        });

        console.log(`${contractName} deployed to: ${deployedContract.options.address}`);
        const newFilePath = path.join(__dirname, '../contracts', contractName+".sol");
        let test = fs.unlinkSync(newFilePath);
        return deployedContract.options.address;
    } catch (error) {
        console.error('Deployment failed:', error);
        throw error;
    }
};

// Exemplo de uso para implantar o contrato ERC4337Wallet
const ownerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Substitua com o endereço real
deployContract('ERC4337Wallet', [ownerAddress]) // Passe argumentos do construtor aqui se necessário
    .then((address) => console.log('ERC4337Wallet deployed address:', address))
    .catch((error) => console.error('Deployment failed:', error));
