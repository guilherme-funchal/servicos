const express = require('express');
const Token = require('../models/token');
const Transaction = require('../models/transact');
const Contract = require('../models/contract');
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
    const { email, address } = req.body;
    if (!email) {
      return res.status(400).send('Email é obrigatório');
    }

    //const result = await User.findOne({ where: { email } })

    try {
      // Gera uma nova wallet
      // Gera uma nova conta
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${address}`
        )
      );

      const account = web3.eth.accounts.create();
      const wallet = account.address;
      const pk = account.privateKey;

      // Armazena no banco de dados
      const result = await User.create({ email, wallet, pk })

      res.status(201).send({ wallet, pk });
    } catch (error) {
      res.status(400).json({ erro: "usuário já existe" })
    }
  },
  async balanceERC20(req, res) {
    const { wallet, contract} = req.body;
    const data = await Contract.findOne({ where: { contract } })

    const result = await User.findOne({ where: { wallet } })

    const templatePath = path.join(__dirname, '../artifacts/contracts', `${data.name}` + '.sol', `${data.name}` + '.json');

    const { abi } = require(templatePath);
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `${data.address}`
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
  async mintERC20(req, res) {
    const { wallet, contract, amount } = req.body;
    const data = await Contract.findOne({ where: { contract } })

    try {
      // Carregar o ABI do contrato
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${data.name}.sol`, `${data.name}.json`);
      const contractJson = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const { abi } = contractJson;

      // Inicializar o Web3
      const web3 = new Web3(new Web3.providers.HttpProvider(data.address));
      const erc20Contract = new web3.eth.Contract(abi, contract);

      // Usar a conta do proprietário para realizar a transação de mint
      const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY; // Defina a chave privada do proprietário no .env
      const ownerAccount = web3.eth.accounts.privateKeyToAccount(ownerPrivateKey);
      web3.eth.accounts.wallet.add(ownerAccount);
      web3.eth.defaultAccount = ownerAccount.address;

      // Realizar a transação de mint
      const tx = await erc20Contract.methods.mint(wallet, Web3.utils.toWei(amount, 'ether')).send({ from: ownerAccount.address });

      // Registrar a transação no banco de dados
      await createTransaction('mint', amount, ownerAccount.address, tx.transactionHash, wallet, null, null);

      res.status(200).json({
        message: 'Tokens mintados com sucesso',
        transactionHash: tx.transactionHash
      });
    } catch (error) {
      console.error('Erro ao mintar tokens:', error);
      res.status(500).send('Erro ao mintar tokens');
    }
  },
  async burnERC20(req, res) {
    const { wallet, contract, amount } = req.body;
    const data = await Contract.findOne({ where: { contract } })

    try {
      const result = await User.findOne({ where: { wallet } });
      if (!result) {
        return res.status(404).send('Usuário não encontrado');
      }

      const templatePath = path.join(__dirname, '../artifacts/contracts', `${data.name}.sol`, `${data.name}.json`);
      const contractJson = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const { abi } = contractJson;

      const web3 = new Web3(new Web3.providers.HttpProvider(data.address));
      const erc20Contract = new web3.eth.Contract(abi, contract);

      const account = web3.eth.accounts.privateKeyToAccount(result.pk);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = account.address;

      const tx = await erc20Contract.methods.burn(Web3.utils.toWei(amount, 'ether')).send({ from: wallet });

      await createTransaction('burn', amount, wallet, tx.transactionHash, null, null, null);

      res.status(200).json({
        message: 'Tokens queimados com sucesso',
        transactionHash: tx.transactionHash
      });
    } catch (error) {
      console.error('Erro ao queimar tokens:', error);
      res.status(500).send('Erro ao queimar tokens');
    }
  },
  async transferERC20(req, res) {
    const { fromWallet, toWallet, contract, network, coin, amount } = req.body;

    try {
      const result = await User.findOne({ where: { wallet: fromWallet } });
      if (!result) {
        return res.status(404).send('Usuário não encontrado');
      }

      const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}.sol`, `${coin}.json`);
      const contractJson = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const { abi } = contractJson;

      const web3 = new Web3(new Web3.providers.HttpProvider(network));
      const erc20Contract = new web3.eth.Contract(abi, contract);

      const account = web3.eth.accounts.privateKeyToAccount(result.pk);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = account.address;

      const tx = await erc20Contract.methods.transfer(toWallet, Web3.utils.toWei(amount, 'ether')).send({ from: fromWallet });

      await createTransaction('transfer', amount, fromWallet, tx.transactionHash, toWallet, null, null);

      res.status(200).json({
        message: 'Tokens transferidos com sucesso',
        transactionHash: tx.transactionHash
      });
    } catch (error) {
      console.error('Erro ao transferir tokens:', error);
      res.status(500).send('Erro ao transferir tokens');
    }
  }
}

