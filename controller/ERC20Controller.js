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
// Configure a conexão com o banco de dados PostgreSQL
dotenv.config();


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


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
  async create(req, res) {
    const { name, symbol, premint, wallet } = req.body;

    try {
      if (!name) {
        res.status(401).json({ message: "Não existe" })
      } else {
        const templatePath = path.join(__dirname, '../templates', 'ERC20Template.sol');

        const randomChars = crypto.randomBytes(6).toString('hex').slice(0, 10);
        const newFileName = `${name}.sol`;
        const newFilePath = path.join(__dirname, '../contracts', newFileName);

        fs.readFile(templatePath, 'utf8', (err, data) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to read template file' });
          }

          let contractContent = data.replace(/{{Name}}/g, name)
            .replace(/{{Symbol}}/g, symbol);

          fs.writeFile(newFilePath, contractContent, (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to create file' });
            }
            res.status(201).json({ file: newFileName });
          });
        });
      }
    } catch (error) {
      res.status(400).json({ error })
    }

  },
  async mint(req, res) {
    try {
      const { contractAddress, fromWallet, localhostUrl, toWallet, amount, coin } = req.body;
      // Subsituir pela chave obtida no HSM
      let result = await getPK(fromWallet);
      let address = result.pk.toString();
      const amountInWei = Web3.utils.toWei(amount, 'ether');
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
      const { abi } = require(templatePath);
      const network = localhostUrl;
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${network}`
        )
      );

      const signer = web3.eth.accounts.privateKeyToAccount(
        `${address}`
      );
      web3.eth.accounts.wallet.add(signer);
      var contratoInteligente = new web3.eth.Contract(abi, `${contractAddress}`);
      const tx = contratoInteligente.methods.mint(toWallet, amountInWei);

      const receipt = await tx
        .send({
          from: signer.address,
          gas: await tx.estimateGas(),
        })
        .once("transactionHash", (txhash) => {
        });
      //res.status(200).send(`Moeda incluída e minerada no bloco ${receipt.blockNumber}`);

      res.status(200).json({
        hash: receipt.transactionHash,
        block: receipt.blockNumber.toString()
      });
      createTransaction("Mint", amountInWei, toWallet, receipt.transactionHash)
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async burn(req, res) {
    try {
      const { contractAddress, fromWallet, localhostUrl, toWallet, amount, coin } = req.body;
      // Subsituir pela chave obtida no HSM
      let result = await getPK(fromWallet);
      let address = result.pk.toString();
      const amountInWei = Web3.utils.toWei(amount, 'ether');
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
      const { abi } = require(templatePath);
      const network = localhostUrl;
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${network}`
        )
      );

      const signer = web3.eth.accounts.privateKeyToAccount(
        `${address}`
      );
      web3.eth.accounts.wallet.add(signer);
      var contratoInteligente = new web3.eth.Contract(abi, `${contractAddress}`);
      const tx = contratoInteligente.methods.burn(amountInWei);

      const receipt = await tx
        .send({
          from: signer.address,
          gas: await tx.estimateGas(),
        })
        .once("transactionHash", (txhash) => {
        });
      //res.status(200).send(`Moeda incluída e minerada no bloco ${receipt.blockNumber}`);

      res.status(200).json({
        hash: receipt.transactionHash,
        block: receipt.blockNumber.toString()
      });
      createTransaction("Burn", amountInWei, toWallet, receipt.transactionHash)
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async transfer(req, res) {
    try {
      const { contractAddress, toWallet, value, localhostUrl, coin, fromWallet } = req.body;
      const amountInWei = Web3.utils.toWei(value, 'ether');
      var result = await getPK(fromWallet);
      let pk = result.pk.toString();

      const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
      const { abi } = require(templatePath);
      const network = localhostUrl;
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${network}`
        )
      );

      const contract = new web3.eth.Contract(abi, contractAddress);
      const account = web3.eth.accounts.privateKeyToAccount(pk);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = account.address;
      const tx = contract.methods.transfer(toWallet, amountInWei);
      const gas = await tx.estimateGas({ from: account.address });
      const gasPrice = await web3.eth.getGasPrice();
      const data = tx.encodeABI();
      const nonce = await web3.eth.getTransactionCount(account.address);

      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: contractAddress,
          data,
          gas,
          gasPrice,
          nonce,
          chainId: await web3.eth.getChainId(),
        },
        pk
      );

      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log('Hash da transação:', receipt.transactionHash);
      res.status(200).json({
        hash: receipt.transactionHash,
        block: receipt.blockNumber.toString()
      });
      createTransaction("Transfer", amountInWei, toWallet, receipt.transactionHash)
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async balanceOf(req, res) {
    try {
      const { contractAddress, coin, localhostUrl, address } = req.body;
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
      const { abi } = require(templatePath);
      const network = localhostUrl;
      var web3 = new Web3(`${network}`);

      var contratoInteligente = new web3.eth.Contract(abi, `${contractAddress}`);

      let balance = await contratoInteligente.methods.balanceOf(address).call(function (err, res) {
        if (err) {
          console.log("Ocorreu um erro", err)
          return
        }
        console.log("Saldo gerado com Sucesso")
      });
      saldo = Web3.utils.fromWei(balance, 'ether');
      //saldo = balance;
      console.log("Balance:", saldo.toString())
      res.status(200).send({ Balance: saldo });
    } catch (error) {
      res.status(400).json({ error })
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