const express = require('express');
const Token = require('../models/token');
const Transaction = require('../models/transact');
const User = require('../models/user');
const fs = require("fs");
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const crypto = require('crypto');
const { Web3 } = require('web3');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const moment = require('moment');
const { balanceOf } = require('./ERC20Controller');

dotenv.config();


async function getPK(token) {
  const now = moment().format();
  const result = await Token.findOne({ where: { token } })
  return result.pk
}

async function createTransaction(type, value, fromwallet, hash, towallet, tokenuri, tokenid) {
  const result = await Transaction.create({ type, value, fromwallet, hash, towallet, tokenuri, tokenid })
}

function readABI(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('ENTRYPOINT_ABI', JSON.parse(fileContent));
    return JSON.parse(fileContent);

  } catch (error) {
    console.error(`Erro ao ler o ABI do arquivo ${filePath}:`, error);
    return null;
  }
}
// Função para obter o JSON do contrato
const getContractJson = (contractName) => {
  const contractPath = path.resolve(__dirname, '../artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found at ${contractPath}`);
  }
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
};

const getContractInstance = (contractName, contractAddress, network) => {
  const contractJson = getContractJson(contractName);
  const abi = contractJson.abi;
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `${network}`
    )
  );
  contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  return new web3.eth.Contract(abi, contractAddress);
};

module.exports = {
  async create(req, res) {
    const { email, network } = req.body;
    if (!email) {
      return res.status(400).send('Email é obrigatório');
    }

    //const result = await User.findOne({ where: { email } })

    try {
      // Gera uma nova wallet
      // Gera uma nova conta
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${network}`
        )
      );

      const account = web3.eth.accounts.create();
      const wallet = account.address;
      console.log("wallet_addres", wallet);
      const pk = account.privateKey;
      console.log("private_key", pk);

      // Armazena no banco de dados
      const result = await User.create({ email, wallet, pk })

      res.status(201).send({ wallet, pk });
    } catch (error) {
      res.status(400).json({ erro: "usuário já existe" })
    }
  },
  async balanceERC20(req, res) {
    const { wallet, contract, network, coin } = req.body;
    const result = await User.findOne({ where: { wallet } })

    const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');

    const { abi } = require(templatePath);
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `${network}`
      )
    );
    const erc20Contract = new web3.eth.Contract(abi, `${contract}`);

    const account = web3.eth.accounts.privateKeyToAccount(result.pk);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    try {
      let balance = await erc20Contract.methods.balanceOf(wallet).call();
      saldo = Web3.utils.fromWei(balance, 'ether');
      //saldo = balance;
      console.log(`Saldo de ${wallet}: ${saldo}`);
      res.status(200).json({
        Saldo: saldo.toString(),
        Address: wallet
      });
    } catch (error) {
      console.error('Erro ao obter o saldo:', error);
    }

  },
  async mint(req, res) {
    const { wallet, contract, network, coin, to, amount } = req.body;

    const result = await User.findOne({ where: { wallet } })
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `${network}`
      )
    );

    const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
    const { abi } = require(templatePath);

    const templatePath2 = path.join(__dirname, '../artifacts/contracts', 'EntryPoint.sol', 'EntryPoint.json');

    const ENTRYPOINT_ABI = readABI(templatePath2)

    if (!Array.isArray(ENTRYPOINT_ABI)) {
      throw new Error('ABI não é um array');
    }

    console.log('ENTRYPOINT_ABI', ENTRYPOINT_ABI);

    const erc20Contract = new web3.eth.Contract(abi, `${contract}`);
    const ENTRYPOINT_ADDRESS = process.env.ENTRYPOINT_ADDRESS;

    const entryPointContract = new web3.eth.Contract(ENTRYPOINT_ABI, ENTRYPOINT_ADDRESS);
    // const entryPointContract = new web3.eth.Contract(ENTRYPOINT_ABI, `${ENTRYPOINT_ADDRESS}`);

    console.log('2');


    console.log('3');
    const data = erc20Contract.methods.mint(to, amount).encodeABI();
    console.log('4');
    const account = web3.eth.accounts.privateKeyToAccount(result.pk);
    console.log('5');
    web3.eth.accounts.wallet.add(account);
    console.log('6');

    web3.eth.defaultAccount = account.address;
    console.log('7');

    const gasLimit = await erc20Contract.methods.mint(to, amount).estimateGas();
    console.log('gas', gasLimit);

    // Criar a transação UserOperation
    const userOperation = {
      sender: web3.eth.defaultAccount,
      callData: data,
      nonce: await web3.eth.getTransactionCount(web3.eth.defaultAccount),
      callGasLimit: gasLimit,
      verificationGasLimit: 300000,
      preVerificationGas: 21000,
      maxFeePerGas: web3.utils.toWei('50', 'gwei'),
      maxPriorityFeePerGas: web3.utils.toWei('2', 'gwei'),
      paymasterAndData: '0x',
      signature: '0x', // Assinatura da operação
    };
    console.log('8');

    const tx = entryPointContract.methods.handleOps([userOperation], web3.eth.defaultAccount);
    console.log('9');
    const gasEstimate = await tx.estimateGas({ from: web3.eth.defaultAccount });
    console.log('10');
    const receipt = await tx.send({ from: web3.eth.defaultAccount, gas: gasEstimate });

  }
}

