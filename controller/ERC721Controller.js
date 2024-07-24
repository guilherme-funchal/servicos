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

// Configure a conexão com o banco de dados PostgreSQL
dotenv.config();


// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_DATABASE,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

const auth = 'Bearer ' + process.env.IPFS_AUTH_TOKEN;
const ipfsUrl = process.env.IPFS_UPLOAD_METADATA;


// async function getPK(token) {
//   const now = moment().format();

//   const query = 'SELECT pk FROM tokens WHERE token = $1';
//   const values = [token];
//   const result = await pool.query(query, values);
//   return result.rows[0];
// }

// async function createTransaction(type, value, fromwallet, hash, towallet, tokenURI, tokenid) {
//   const now = moment().format();
//   const query = 'INSERT INTO transactions (type, value, fromwallet, hash, date, towallet, tokenURI, tokenid ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
//   const values = [type, value, fromwallet, hash, now, towallet, tokenURI, tokenid];
//   const result = await pool.query(query, values);
//   return result.rows[0];
// }

async function getPK(token) {
  const now = moment().format();
  const result = await Token.findOne({ where: { token } })
  console.log("result", result.dataValues)
  return result.dataValues
}


async function createTransaction(type, value, fromwallet, hash, towallet, tokenuri, tokenid) {
  const result = await Transaction.create({ type, value, fromwallet, hash, towallet, tokenuri, tokenid })
}

module.exports = {
  async mint(req, res) {
    const { recipient, fromWallet, coin, localhostUrl, contractAddress, imageHash } = req.body;
    try {
      //const tokenURI = await uploadMetadata(metadata);
      const web3 = new Web3(new Web3.providers.HttpProvider(localhostUrl));
      const contractPath = path.resolve(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
      const source = fs.readFileSync(contractPath, 'utf8');
      const { abi, bytecode } = JSON.parse(source);

      //Busca chave privada pelo endereço da Wallet
      let result = await getPK(fromWallet);

      const account = web3.eth.accounts.privateKeyToAccount(result.pk);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = account.address;
      const contract = new web3.eth.Contract(abi, contractAddress);

      const metadata = {
        "name": "NFT" + `${coin}`,
        "description": "NFT Gerado para " + `${coin}`,
        "image": "ipfs://" + `${imageHash}`,
        "attributes":  req.body.attributes
      }

      //console.log("->", JSON.stringify(metadata));

      const response = await axios.post(ipfsUrl + 'upload-metadata', JSON.stringify(metadata), {
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json'
        },
      });

      const tokenURI = response.data.tokenURI;
      // const tx = await contract.methods.safeMint(recipient, tokenURI).send({ from: account.address });
      const data = contract.methods.safeMint(recipient, tokenURI).encodeABI();
      const gasEstimate = await contract.methods.safeMint(recipient, tokenURI).estimateGas({ from: account.address });

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
      const transferEvents = await contract.getPastEvents('Transfer', {
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
    const { recipient, fromWallet, coin, localhostUrl, contractAddress, tokenId } = req.body;
    const web3 = new Web3(new Web3.providers.HttpProvider(localhostUrl));
    const contractPath = path.resolve(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
    const source = fs.readFileSync(contractPath, 'utf8');
    const { abi, bytecode } = JSON.parse(source);
    //Busca chave privada pelo endereço da Wallet
    let result = await getPK(fromWallet);
    const account = web3.eth.accounts.privateKeyToAccount(result.pk);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    const contract = new web3.eth.Contract(abi, contractAddress);

    try {

      const owner = await contract.methods.ownerOf(tokenId).call();
      const tokenURI = await contract.methods.tokenURI(tokenId).call();

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
      const { contractAddress, localhostUrl, coin } = req.body;
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
      const { abi } = require(templatePath);
      const network = localhostUrl;
      var web3 = new Web3(`${network}`);
      const contract = new web3.eth.Contract(abi, contractAddress);
      const owner = await contract.methods.owner().call();
      console.log("Owner:", owner)
      res.status(200).send({ Owner: owner });
    } catch (error) {
      console.error("Erro ao obter o owner do contrato:", error);
      throw error;
    }
  },
  async info(req, res) {
    try {
      const { contractAddress, localhostUrl, coin } = req.body;
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
      const { abi } = require(templatePath);
      const network = localhostUrl;
      var web3 = new Web3(`${network}`);
      const contract = new web3.eth.Contract(abi, contractAddress);
      const symbol = await contract.methods.symbol().call();
      console.log("Symbol:", symbol)
      res.status(200).send({ Symbol: symbol });
    } catch (error) {
      console.error("Erro ao obter o símbolo do token:", error);
      throw error;
    }
  }
}   