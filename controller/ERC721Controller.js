const express = require('express');
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
const { create } = require('ipfs-http-client');
const axios = require('axios');
const Token = require('../models/token');
const Transaction = require('../models/transact');
const Contract = require('../models/contract');

// Configure a conexão com o banco de dados PostgreSQL
dotenv.config();

const auth = 'Bearer ' + process.env.IPFS_AUTH_TOKEN;
const ipfsUrl = process.env.IPFS_UPLOAD_METADATA;

async function getPK(token) {
  const now = moment().format();
  const result = await Token.findOne({ where: { token } })
  return result.dataValues
}

async function createTransaction(type, value, fromwallet, hash, towallet, tokenuri, tokenid) {
  const result = await Transaction.create({ type, value, fromwallet, hash, towallet, tokenuri, tokenid })
}

module.exports = {
  async mint(req, res) {
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
  async view(req, res) {
    const { fromWallet, contract, tokenId } = req.body;
    const data = await Contract.findOne({ where: { contract } })
    let result = await getPK(data.wallet);

    const web3 = new Web3(new Web3.providers.HttpProvider(data.address));
    const contractPath = path.resolve(__dirname, '../artifacts/contracts', `${data.name}` + '.sol', `${data.name}` + '.json');
    const source = fs.readFileSync(contractPath, 'utf8');
    const { abi, bytecode } = JSON.parse(source);
    //Busca chave privada pelo endereço da Wallet
    
    const account = web3.eth.accounts.privateKeyToAccount(result.pk);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    const smartcontract = new web3.eth.Contract(abi, contract);

    try {

      const owner = await smartcontract.methods.ownerOf(tokenId).call();
      const tokenURI = await smartcontract.methods.tokenURI(tokenId).call();

      res.send({ success: true, owner, tokenURI });
    } catch (error) {
      res.status(500).send({ success: false, error: error.message });
    }
  },
  async burn(req, res) {
    const { recipient, fromWallet, coin, localhostUrl, contractAddress, tokenId } = req.body;
    try {
      const web3 = new Web3(new Web3.providers.HttpProvider(localhostUrl));
      const contractPath = path.resolve(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
      const source = fs.readFileSync(contractPath, 'utf8');
      const { abi, bytecode } = JSON.parse(source);

      //Busca chave privada pelo endereço da Wallet
      let result = await getPK(fromWallet);
      console.log("->", result.pk);
      const account = web3.eth.accounts.privateKeyToAccount(result.pk);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = account.address;
      const contract = new web3.eth.Contract(abi, contractAddress);
      const tokenURI = await contract.methods.tokenURI(tokenId).call();
      const filecid = tokenURI.replace("ipfs://", "");

      const data = contract.methods.burn(tokenId).encodeABI();
      
      const gasEstimate = await contract.methods.burn(tokenId).estimateGas({ from: account.address });
      // Obtém o preço atual do gás
      const gasPrice = await web3.eth.getGasPrice();

      const tx = {
        from: account.address,
        to: contractAddress,
        gas: gasEstimate,
        gasPrice: gasPrice,
        data: data
      };

      // Assinar a transação
      const signedTx = await web3.eth.accounts.signTransaction(tx, result.pk);

      // Enviar a transação
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log("filecid", filecid);

      const response = await axios.delete(ipfsUrl + 'metadado/' + filecid, {
        headers: {
          'Authorization': auth
        },
       });
      console.log("resultado", response.data);

      res.status(200).json({
        hash: receipt.transactionHash,
        block: receipt.blockNumber.toString(),
        ipfs: response.data
      });
      
      //res.status(response.status).json(response.data);

    } catch (error) {
      res.status(500).send({ success: false, error: error.message });


    //   if (!res.headersSent) {
    //     res.status(500).json({ error: error.message });
    // } else {
    //     console.error('Response already sent:', error);
    // }
    }
  },
  async owner(req, res) {
    try {
      const { contract, localhostUrl, coin } = req.body;
      const result = await Contract.findOne({ where: { contract } })

      const templatePath = path.join(__dirname, '../artifacts/contracts', `${result.name}` + '.sol', `${result.name}` + '.json');
      const { abi } = require(templatePath);
      const network = result.address;
      var web3 = new Web3(`${network}`);
      const smartcontract = new web3.eth.Contract(abi, contract);
      const owner = await smartcontract.methods.owner().call();
      console.log("Owner:", owner)
      res.status(200).send({ Owner: owner });
    } catch (error) {
      console.error("Erro ao obter o owner do contrato:", error);
      throw error;
    }
  },
  async info(req, res) {
    try {
      const { contract } = req.body;
      const result = await Contract.findOne({ where: { contract } })
      
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${result.name}` + '.sol', `${result.name}` + '.json');
      const { abi } = require(templatePath);
      const network = result.address;
      var web3 = new Web3(`${network}`);
      const smartcontract = new web3.eth.Contract(abi, contract);
      const symbol = await smartcontract.methods.symbol().call();
      console.log("Symbol:", symbol)
      res.status(200).send({ Symbol: symbol });
    } catch (error) {
      console.error("Erro ao obter o símbolo do token:", error);
      throw error;
    }
  }
}   