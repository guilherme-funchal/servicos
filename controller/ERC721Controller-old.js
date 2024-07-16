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
const ipfsUrl = 'http://127.0.0.1:4000/upload-metadata'; // Substitua pela URL da API do seu servidor IPFS

// Função para fazer upload no IPFS
async function uploadMetadata(metadata) {
  try {
    const response = await axios.post(ipfsUrl, JSON.stringify(metadata), {
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json'
      },
    });

    // O retorno da API IPFS pode variar; ajuste conforme necessário
    console.log("cid->", response.data);
    const cid = response.data.tokenURI;
    console.log("cid->", response.data.tokenURI);
    return `${cid}`;
    //return `ipfs://${cid}`;
  } catch (error) {
    console.error('Erro ao fazer upload para IPFS:', error);
    throw error;
  }
}


async function getPK(wallet) {
  const now = moment().format();
  const query = 'SELECT pk FROM wallets WHERE wallet = $1';
  const values = [wallet];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function createTransaction(type, value, wallet, hash) {
  const now = moment().format();
  const query = 'INSERT INTO transactions (type, value, wallet, date, hash) VALUES ($1, $2, $3, $4, $5)';
  const values = [type, value, wallet, now, hash];
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  async mint(req, res) {
    // Configuração do Provedor e Wallet
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    let coin = "Teste";
    wallet="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
    const { abi } = require(templatePath);
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    console.log("--->", process.env.IPFS_AUTH_TOKEN);
    const { recipient, metadata } = req.body;
    console.log(metadata);
    const tokenURI = await uploadMetadata(metadata);
    console.log("Token URI", tokenURI);

    const tx = await contract.createNFT(recipient, tokenURI);
    await tx.wait();
    res.status(200).json({ message: 'NFT criado com sucesso!', tokenURI });

    // try {
    //   const { contractAddress, fromWallet, localhostUrl, toWallet, amount, coin } = req.body;
    //   // Subsituir pela chave obtida no HSM
    //   let result = await getPK(fromWallet);
    //   let address = result.pk.toString();
    //   const amountInWei = Web3.utils.toWei(amount, 'ether');
    //   const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
    //   const { abi } = require(templatePath);
    //   const network = localhostUrl;
    //   const web3 = new Web3(
    //     new Web3.providers.HttpProvider(
    //       `${network}`
    //     )
    //   );

    //   const signer = web3.eth.accounts.privateKeyToAccount(
    //     `${address}`
    //   );
    //   web3.eth.accounts.wallet.add(signer);
    //   var contratoInteligente = new web3.eth.Contract(abi, `${contractAddress}`);
    //   const tx = contratoInteligente.methods.mint(toWallet, amountInWei);

    //   const receipt = await tx
    //     .send({
    //       from: signer.address,
    //       gas: await tx.estimateGas(),
    //     })
    //     .once("transactionHash", (txhash) => {
    //     });
    //   //res.status(200).send(`Moeda incluída e minerada no bloco ${receipt.blockNumber}`);

    //   res.status(200).json({
    //     hash: receipt.transactionHash,
    //     block: receipt.blockNumber.toString()
    //   });
    //   createTransaction("Mint", amountInWei, toWallet, receipt.transactionHash)
    // } catch (error) {
    //   res.status(400).json({ error })
    // }
  },
}   