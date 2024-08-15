const { JsonRpcProvider, Contract, Wallet } = require('ethers');
const crypto = require('crypto');

const fs = require('fs');
const { Web3 } = require('web3');
const { ethers } = require('ethers');
const path = require('path');
const {
  eoaPublicKey,
  eoaPrivateKey,
  accountFactoryAddress,
  entryPointAddress,
  exampleContractAddress2,
  paymasterAddress } = require('../addressesConfig');
const { updateAddressesConfig } = require('../middlewares/updateAddressesConfig');
const dotenv = require('dotenv');
const Token = require('../models/token');
const Transaction = require('../models/transact');
const User = require('../models/user');
const { balanceOf } = require('./ERC20Controller');
const { priorityFeePerGas } = require('./gasEstimator');
const { createEOA } = require('./createEoaWallet');

dotenv.config();


// Substitua com sua chave privada
const privateKey = process.env.PRI_KEY

// Carregar os ABIs dos contratos a partir dos arquivos JSON
const entryPointABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis', 'EntryPoint.json')));
const accountFactoryABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis', 'AccountFactory.json')));
const simpleAccountABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis', 'SimpleAccount.json')));
const exampleContractABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis', 'exampleContract.json')));
const exampleContractABI2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis', 'exampleContract2.json')));

function createHash(data) {
  //  return crypto.createHash('sha256').update(data).digest('hex');
  const hash = crypto.createHash('sha256');
  hash.update(data);
  const hashData = "0x" + hash.digest('hex').slice(0, 40); // Retorna o hash como uma string hexadecimal
  return hashData;
}

async function createTransaction(type, value, fromwallet, hash, towallet, tokenuri, tokenid) {
  const result = await Transaction.create({ type, value, fromwallet, hash, towallet, tokenuri, tokenid })
}

module.exports = {
  async create(req, res) {
    try {
      const { email, cpf, address } = req.body;

      // Configure seu provider para o endereço do RPC
      const provider = new JsonRpcProvider(address);
      const signer = new Wallet(privateKey, provider);
      const EOA = createEOA();
      const hash =  createHash(email);
      console.log("hash->", hash);

      // console.log('Chave Privada:', wallet.privateKey);
      // console.log('Chave Pública:', wallet.publicKey);
      // console.log('Endereço Ethereum:', wallet.address);

      // Criar instâncias dos contratos usando o provider
      const entryPoint = new Contract(entryPointAddress, entryPointABI, signer);
      const accountFactory = new Contract(accountFactoryAddress, accountFactoryABI, signer);
      const initCode = accountFactoryAddress + accountFactory.interface.encodeFunctionData('createAccount', [EOA[0], 0]).slice(2);
      
      console.log("initCode->", initCode);

      try {
        const result = await entryPoint.getSenderAddress(initCode);

      } catch (transaction) {
        if (transaction.data && typeof transaction.data === 'string') {
          var simpleAccountAddress = '0x' + transaction.data.slice(-40);
        } else if (transaction.message && transaction.message.includes('return data:')) {
          const returnData = transaction.message.split('return data: ')[1];
          var simpleAccountAddress = '0x' + returnData.slice(-40);
          simpleAccountAddress = simpleAccountAddress.replace(")", "");
        } else {
          console.error("O objeto transaction não contém um campo data ou uma mensagem reconhecível.");
          return;
        }
      }
      // Armazena no banco de dados
      const result = await User.create({ email, cpf, simpleAccount: simpleAccountAddress, privateKey: EOA[1], publicKey: EOA[0] })

      res.status(200).json({
        cpf: cpf,
        email: email,
        simpleAccountAddress: simpleAccountAddress
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Usuário já existe" });
    }
  },
  async mintERC20(req, res) {
    const { contract, simpleAccountAddress, amount, address } = req.body;
    const provider = new JsonRpcProvider(address);
    const user = await User.findOne({ where: { simpleAccount: simpleAccountAddress } })

    // Configure seu provider para o endereço do RPC
    const signer = new Wallet(eoaPrivateKey, provider);

    // Criar instâncias dos contratos usando o provider
    const entryPoint = new Contract(entryPointAddress, entryPointABI, signer);
    const accountFactory = new Contract(accountFactoryAddress, accountFactoryABI, signer);
    const simpleAccount = new Contract(simpleAccountAddress, simpleAccountABI, signer);
    const exampleContract = new Contract(exampleContractAddress2, exampleContractABI2, signer);
    const amountInWei = Web3.utils.toWei(amount, 'ether');
    const mintAmount = amountInWei;

    let balanceWei = await provider.getBalance(signer.address);
    console.log(`The balance of the signer is:  ${signer.address} ${balanceWei} Wei`);

    // balanceWei = await provider.getBalance(user.publicKey);
    // console.log(`The balance of the user is: ${user.publicKey} ${balanceWei} Wei`);

    // Preparando dados para transação
    const funcTargetData = exampleContract.interface.encodeFunctionData('mint', [simpleAccountAddress, mintAmount]);
    const data = simpleAccount.interface.encodeFunctionData('execute', [exampleContractAddress2, 0, funcTargetData]);
    let initCode = accountFactoryAddress + accountFactory.interface.encodeFunctionData('createAccount', [eoaPublicKey, 0]).slice(2);

    const code = await provider.getCode(simpleAccountAddress);

    if (code !== '0x') {
      initCode = '0x';
    }

    //console.log('maxPriorityFeePerGas:', await priorityFeePerGas(address));
    const nonce = await entryPoint.getNonce(simpleAccountAddress, 0);

    // Criando objeto `userOp`
    const userOp = {
      sender: simpleAccountAddress,
      nonce: await entryPoint.getNonce(simpleAccountAddress, 0),
      initCode: initCode,
      callData: data,
      callGasLimit: '100000',
      verificationGasLimit: '1000000',
      preVerificationGas: '0x10edc8',
      maxFeePerGas: '0x0973e0',
      maxPriorityFeePerGas: await priorityFeePerGas(address),
      paymasterAndData: paymasterAddress,
      signature: '0x'
    };

    // Assinando o hash
    const hash = await entryPoint.getUserOpHash(userOp);
    userOp.signature = await signer.signMessage(ethers.getBytes(hash));

    
    try {
      // Enviando a transação
      const tx = await entryPoint.handleOps([userOp], eoaPublicKey,
      {
        gasLimit: 2000000
      });
      const receipt = await tx.wait();
      console.log('Transaction successful');
      res.status(200).json({ transaction: "successful" });
      //console.log("tx->", signer)
      createTransaction("Mint", amountInWei, simpleAccountAddress, tx.hash, signer.address, "-", "-");
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  },
  async balanceERC20(req, res) {
    const { simpleAccountAddress, address } = req.body;
    // Configure seu provider para o endereço do RPC
    var web3 = new Web3(`${address}`);

    const provider = new JsonRpcProvider(address);
    const signer = new Wallet(privateKey, provider);

    try {
      const entryPoint = new Contract(entryPointAddress, entryPointABI, signer);
      const accountFactory = new Contract(accountFactoryAddress, accountFactoryABI, signer);
      const simpleAccount = new Contract(simpleAccountAddress, simpleAccountABI, signer);
      const exampleContract2 = new Contract(exampleContractAddress2, exampleContractABI2, signer);
      const accountAddress = address || defaultAddress;

      if (simpleAccountAddress.length === 42) {
        const checksumAddress = await accountFactory.getAddress(simpleAccountAddress);
        const balance = await exampleContract2.balanceOf(simpleAccountAddress);
        saldo = Web3.utils.fromWei(balance, 'ether');
        console.log("balance:", saldo.toString());
        res.json({ balance: saldo.toString() });
      } else {
        console.error('Invalid address:', simpleAccountAddress);
        res.status(400).json({ error: 'Invalid address' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
