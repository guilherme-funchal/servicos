require('dotenv').config();
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const BN = require('bn.js');  // Importando BN.js corretamente

// Configuração do Web3
const network = "http://127.0.0.1:8545";

const web3 = new Web3(
    new Web3.providers.HttpProvider(
        `${network}`
    )
);


const deploy = async () => {
    const [deployer] = await web3.eth.getAccounts();
    console.log("Deploying contracts with the account:", deployer);
  
    const balance = await web3.eth.getBalance(deployer);
    console.log("Deployer balance:", web3.utils.fromWei(balance, 'ether'), "ETH");
  
    const minimumBalance = new BN(web3.utils.toWei('1', 'ether'));
    const currentBalance = new BN(balance);
  
    if (currentBalance.lt(minimumBalance)) {
      console.error("Insufficient balance for deployment. Please ensure the deployer account has at least 1 ETH.");
      process.exit(1);
    }
  
    // Deploy EntryPoint contract
    const entryPointPath = path.resolve(__dirname, '../artifacts/contracts/EntryPoint.sol/EntryPoint.json');
    const entryPointSource = fs.readFileSync(entryPointPath, 'utf8');
    const entryPointAbi = JSON.parse(entryPointSource).abi;
    const entryPointBytecode = JSON.parse(entryPointSource).bytecode;
  
    const EntryPointContract = new web3.eth.Contract(entryPointAbi);
    const entryPointInstance = await EntryPointContract.deploy({
      data: entryPointBytecode
    }).send({
      from: deployer,
      gas: 1500000,
      gasPrice: '30000000000'
    });
  
    console.log("EntryPoint deployed to:", entryPointInstance.options.address);
  
    // Deploy ERC4337Wallet contract
    const erc4337WalletPath = path.resolve(__dirname, '../artifacts/contracts/ERC4337Wallet.sol/ERC4337Wallet.json');
    const erc4337WalletSource = fs.readFileSync(erc4337WalletPath, 'utf8');
    const erc4337WalletAbi = JSON.parse(erc4337WalletSource).abi;
    const erc4337WalletBytecode = JSON.parse(erc4337WalletSource).bytecode;
  
    const ERC4337WalletContract = new web3.eth.Contract(erc4337WalletAbi);
    const erc4337WalletInstance = await ERC4337WalletContract.deploy({
      data: erc4337WalletBytecode,
      arguments: [entryPointInstance.options.address]
    }).send({
      from: deployer,
      gas: 1500000,
      gasPrice: '30000000000'
    });
  
    console.log("ERC4337Wallet deployed to:", erc4337WalletInstance.options.address);
  };
  
  deploy()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });