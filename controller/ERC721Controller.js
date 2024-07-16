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

// Configure a conexão com o banco de dados PostgreSQL
dotenv.config();


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const auth = 'Bearer ' + process.env.IPFS_AUTH_TOKEN;
const ipfsUrl = process.env.IPFS_UPLOAD_METADATA; 

// Função para fazer upload no IPFS
// async function uploadMetadata(metadata) {
//   try {
//     const response = await axios.post(ipfsUrl, JSON.stringify(metadata), {
//       headers: {
//         'Authorization': auth,
//         'Content-Type': 'application/json'
//       },
//     });
//     // O retorno da API IPFS pode variar; ajuste conforme necessário
//     const cid = response.data.tokenURI;
//     return `${cid}`;
//     //return `ipfs://${cid}`;
//   } catch (error) {
//     console.error('Erro ao fazer upload para IPFS:', error);
//     throw error;
//   }
// }

// async function uploadMetadata(metadata) {
//   try {
//     const response = await axios.post(ipfsUrl, JSON.stringify(metadata), {
//       headers: {
//         'Authorization': auth,
//         'Content-Type': 'application/json'
//       },
//     });

//     // O retorno da API IPFS pode variar; ajuste conforme necessário
//     const cid = response.data.tokenURI;
//     return `${cid}`;
//     //return `ipfs://${cid}`;
//   } catch (error) {
//     console.error('Erro ao fazer upload para IPFS:', error);
//     throw error;
//   }
// }

async function getPK(wallet) {
  const now = moment().format();
  const query = 'SELECT pk FROM wallets WHERE wallet = $1';
  const values = [wallet];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function createTransaction(type, value, fromwallet, hash, towallet, tokenURI) {
  const now = moment().format();
  const query = 'INSERT INTO transactions (type, value, fromwallet, hash, date, towallet, tokenURI ) VALUES ($1, $2, $3, $4, $5, $6, $7)';
  const values = [type, value, fromwallet, hash, now, towallet, tokenURI];
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  async mint(req, res) {
    const {recipient, fromWallet, coin, localhostUrl, contractAddress, imageHash} = req.body;
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
        name: 'NFT ' +  `${coin}`,
        description: 'NFT Gerado para ' +  `${coin}`,
        hash: imageHash,
        attributes: req.body.attributes
      };

      const response = await axios.post(ipfsUrl, JSON.stringify(metadata), {
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json'
        },
      });
      const tokenURI = response.data.tokenURI;
      const tx = await contract.methods.createNFT(recipient, tokenURI).send({ from: account.address });

      createTransaction("Mint NFT", 0, recipient, tx.transactionHash, account.address, tokenURI)

      res.status(200).json({
        tokenURI: tokenURI,
        txHash: tx.transactionHash
      });
    } catch (error) {
      res.status(400).json({ error })
    }
  },
}   