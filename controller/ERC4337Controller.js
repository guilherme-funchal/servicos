const express = require('express');
const Tokens = require('../models/token');
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


async function createTransaction(type, value, fromwallet, hash, towallet, tokenuri, tokenid) {
  const result = await Transaction.create({ type, value, fromwallet, hash, towallet, tokenuri, tokenid })
}

module.exports = {
  async create(req, res) {
    const { email, address} = req.body;
    if (!email) {
      return res.status(400).send('Email é obrigatório');
    }

    const exist = await User.findOne({ where: { email } })

    if (!exist==0) {
      return res.status(400).json({email: "ja existe"});
    }

    try {
      // Gera uma nova wallet e nova conta

      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${address}`
        )
      );

      const account = web3.eth.accounts.create();
      //const account = createAccount();

      const wallet = account.address;
      const pk = account.privateKey;

      // Armazena no banco de dados
      const result = await User.create({ email, wallet, pk })

      res.status(201).send({ email, wallet, pk });
    } catch (error) {
      res.status(400).json({ erro: "usuário já existe" })
    }
  },
  async mintERC20(req, res) {
    const { email, amount, contract } = req.body;

    //Busca informacoes usuario
    const result = await User.findOne({ where: { email } });

    //Busca informações do contrato
    const contracts = await Contract.findOne({ where: { contract } });
    const from = contracts.wallet;

    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `${contracts.address}`
      )
    );

    //Carrega abstracao
    const templatePath = path.join(__dirname, '../artifacts/contracts', `${contracts.name}` + '.sol', `${contracts.name}` + '.json');
    const erc20Abi = require(templatePath).abi;
    const erc20Address = contract;
    const erc20Contract = new web3.eth.Contract(erc20Abi, erc20Address);

    try {
      const wallet = result.wallet;
      const amountInWei = web3.utils.toWei(amount, 'ether');
      const receipt = await erc20Contract.methods.mint(wallet, amountInWei).send({ from: from });

      res.status(200).json({
        hash: receipt.transactionHash,
        block: receipt.blockNumber.toString()
      });
      createTransaction("Mint", amountInWei, wallet, receipt.transactionHash, from, "-", "-")
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  async burnERC20(req, res) {
    const { email, amount, contract } = req.body;
    const result = await User.findOne({ where: { email } })

    //Busca informações do contrato
    const contracts = await Contract.findOne({ where: { contract } });



    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `${contracts.address}`
      )
    );

    //Configuração do acesso a contas abstratas
    const entryPointAbi = require(process.env.ENTRYPOINTABI).abi;
    const entryPointContract = new web3.eth.Contract(entryPointAbi, process.env.ENTRYPOINT_ADDRESS);
    const erc20Address = contract;
    const from = contracts.wallet;
    const templatePath = path.join(__dirname, '../artifacts/contracts', `${contracts.name}` + '.sol', `${contracts.name}` + '.json');
    const erc20Abi = require(templatePath).abi;
    const erc20Contract = new web3.eth.Contract(erc20Abi, erc20Address);
    const amountInWei = web3.utils.toWei(amount, 'ether');

    try {
      const wallet = result.wallet;
      const receipt = await erc20Contract.methods.burnFrom(result.wallet, amountInWei).send({ from: from });

      res.status(200).json({
        hash: receipt.transactionHash,
        block: receipt.blockNumber.toString()
      });
      createTransaction("Burn", amountInWei, result.wallet, receipt.transactionHash, from, "-", "-")
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  async transferERC20(req, res) {
    const { fromEmail, toEmail, amount, contract } = req.body;

    //Busca informações do usuario from
    let email = fromEmail
    let result = await User.findOne({ where: { email } })
    const fromResult = result.wallet;

    //Busca informações do usuario to
    email = toEmail
    result = await User.findOne({ where: { email } })
    const toResult = result.wallet;

    //Busca informações do contrato
    const contracts = await Contract.findOne({ where: { contract } });

    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `${contracts.address}`
      )
    );

    //Convert valor moeda to Wei
    const amountInWei = web3.utils.toWei(amount, 'ether');

    //Carrega abstração
    const entryPointAbi = require(process.env.ENTRYPOINTABI).abi;
    const entryPointContract = new web3.eth.Contract(entryPointAbi, process.env.ENTRYPOINT_ADDRESS);
    const from = contracts.wallet;
    const templatePath = path.join(__dirname, '../artifacts/contracts', `${contracts.name}` + '.sol', `${contracts.name}` + '.json');
    const erc20Abi = require(templatePath).abi;
    const erc20Address = contract;
    const erc20Contract = new web3.eth.Contract(erc20Abi, erc20Address);


    try {
      const wallet = result.wallet;
      const burn = await erc20Contract.methods.burnFrom(fromResult, amountInWei).send({ from: from });
      const mint = await erc20Contract.methods.mint(toResult, amountInWei).send({ from: from });

      res.status(200).json({
        "Burn hash": burn.transactionHash,
        "Burn block": burn.blockNumber.toString(),
        "Mint hash": mint.transactionHash,
        "Mint block": mint.blockNumber.toString()
      });

      createTransaction("Transfer", amountInWei, fromResult, receipt.transactionHash, toResult, "-", "-")
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  async balanceERC20(req, res) {
    const { email, contract } = req.body;

    //Busca informações do usuario
    const result = await User.findOne({ where: { email } })

    //Busca informações do contrato
    const contracts = await Contract.findOne({ where: { contract } });

    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `${contracts.address}`
      )
    );

    //Carrega abastracao
    const from = contracts.wallet;
    const entryPointAbi = require(process.env.ENTRYPOINTABI).abi;
    const entryPointContract = new web3.eth.Contract(entryPointAbi, process.env.ENTRYPOINT_ADDRESS);
    const templatePath = path.join(__dirname, '../artifacts/contracts', `${contracts.name}` + '.sol', `${contracts.name}` + '.json');
    const erc20Abi = require(templatePath).abi;
    const erc20Address = contract;
    const erc20Contract = new web3.eth.Contract(erc20Abi, erc20Address);


    try {
      const balance = await erc20Contract.methods.balanceOf(result.wallet).call();
      const balanceInEther = web3.utils.fromWei(balance, 'ether');
      res.json({ balance: balanceInEther });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  async mint721(req, res) {
    const { recipient, contract, imageHash } = req.body;
    try {
      //const tokenURI = await uploadMetadata(metadata);
      const address = await Contract.findOne({ where: { contract } })

      const web3 = new Web3(new Web3.providers.HttpProvider(address.address));
      const contractPath = path.resolve(__dirname, '../artifacts/contracts', `${address.name}` + '.sol', `${address.name}` + '.json');
      const source = fs.readFileSync(contractPath, 'utf8');
      const { abi, bytecode } = JSON.parse(source);

      //Busca chave privada pelo endereço da Wallet
      let result = await getPK(address.wallet);

      const account = web3.eth.accounts.privateKeyToAccount(result.pk);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = account.address;
      const smartcontract = new web3.eth.Contract(abi, contract);

      const metadata = {
        "name": "NFT" + `${address.name}`,
        "description": "NFT Gerado para " + `${address.name}`,
        "image": "ipfs://" + `${imageHash}`,
        "attributes":  req.body.attributes
      }


      const response = await axios.post(ipfsUrl + 'upload-metadata', JSON.stringify(metadata), {
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json'
        },
      });

      const tokenURI = response.data.tokenURI;
      // const tx = await contract.methods.safeMint(recipient, tokenURI).send({ from: account.address });
      const data = smartcontract.methods.safeMint(recipient, tokenURI).encodeABI();
      const gasEstimate = await smartcontract.methods.safeMint(recipient, tokenURI).estimateGas({ from: account.address });

      // Obtém o preço atual do gás
      const gasPrice = await web3.eth.getGasPrice();

      const tx = {
        from: account.address,
        to: contract,
        gas: gasEstimate,
        gasPrice: gasPrice,
        data: data
      };

      // Assinar a transação
      const signedTx = await web3.eth.accounts.signTransaction(tx, result.pk);

      // Enviar a transação
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      const transferEvents = await smartcontract.getPastEvents('Transfer', {
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber
      });

      if (transferEvents.length > 0) {
        let idtmp = String(transferEvents[0].returnValues.tokenId);
        id = idtmp.replace('n', '');
        res.status(200).json({
          tokenId: id,
          tokenURI: tokenURI,
          txHash: receipt.transactionHash
        });
        createTransaction("Mint NFT", 0, recipient, receipt.transactionHash, account.address, tokenURI, id)
        //        res.send({ tokenId });
      } else {
        console.error("NFT não gerado");
        res.status(500).send('NFT nao foi gerado');
      }

    } catch (error) {
      res.status(400).json({ error })
    }
  },
}  