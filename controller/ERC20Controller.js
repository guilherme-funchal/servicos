const express = require('express');
const Token = require('../models/token');
const Transaction = require('../models/transact');
const Contract = require('../models/contract');
const fs = require("fs");
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const crypto = require('crypto');
const { Web3 } = require('web3');
const dotenv = require('dotenv');
const moment = require('moment');

dotenv.config();

async function getPK(token) {
  const result = await Token.findOne({ where: { token } })
  return result.pk 
}

async function createTransaction(type, value, fromwallet, hash, towallet, tokenuri, tokenid) {
  const result = await Transaction.create({ type, value, fromwallet, hash, towallet, tokenuri, tokenid })
}

module.exports = {
  async mint(req, res) {
    try {
      const { contract, toWallet, amount} = req.body;
      const result = await Contract.findOne({ where: { contract } })

      // Subsituir pela chave obtida no HSM
      let address = await getPK(result.wallet);
      const amountInWei = Web3.utils.toWei(amount, 'ether');
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${result.name}` + '.sol', `${result.name}` + '.json');
      const { abi } = require(templatePath);
      const network = result.address;
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${network}`
        )
      );

      const signer = web3.eth.accounts.privateKeyToAccount(
        `${address}`
      );
      
      web3.eth.accounts.wallet.add(signer);
      var contratoInteligente = new web3.eth.Contract(abi, `${contract}`);
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
      createTransaction("Mint", amountInWei, toWallet, receipt.transactionHash, signer.address, "-", "-")
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async burn(req, res) {
    try {
      const { contract, toWallet, amount} = req.body;
      const result = await Contract.findOne({ where: { contract } })
      
      // Subsituir pela chave obtida no HSM
      let address =await getPK(toWallet);
      
      const amountInWei = Web3.utils.toWei(amount, 'ether');
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${result.name}` + '.sol', `${result.name}` + '.json');
      const { abi } = require(templatePath);
      const network = result.address;
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${network}`
        )
      );

      const signer = web3.eth.accounts.privateKeyToAccount(
        `${address}`
      );

      web3.eth.accounts.wallet.add(signer);
      var contratoInteligente = new web3.eth.Contract(abi, `${contract}`);
      const owner = await contratoInteligente.methods.owner().call();

      let balance = await contratoInteligente.methods.balanceOf(toWallet).call(function (err, res) {
        if (err) {
          console.log("Ocorreu um erro", err)
          return
        }
        console.log("Saldo gerado com Sucesso")
      });

      const saldo = Web3.utils.fromWei(balance, 'ether');

      if (Number(saldo) >= Number(amount)) {
        const tx = contratoInteligente.methods.burnFrom(toWallet, amountInWei);

        const receipt = await tx
          .send({
            from: owner,
            to: contract,
            gas: await tx.estimateGas(),
          })
          .once("transactionHash", (txhash) => {
          });

        //res.status(200).send(`Moeda incluída e minerada no bloco ${receipt.blockNumber}`);


        res.status(200).json({
          hash: receipt.transactionHash,
          block: receipt.blockNumber.toString()
        });
        createTransaction("Burn", amountInWei, toWallet, receipt.transactionHash, signer.address, "-", "-")
      } else {
        res.status(400).json({
          Saldo: saldo,
          Solicitado: amount
        });
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async transfer(req, res) {
    try {
      const { contract, toWallet, amount, localhostUrl, coin, fromWallet } = req.body;
      const result = await Contract.findOne({ where: { contract } })

      const amountInWei = Web3.utils.toWei(amount, 'ether');
      let pk = await getPK(fromWallet);
      const templatePath = path.join(__dirname, '../artifacts/contracts', `${result.name}` + '.sol', `${result.name}` + '.json');
      const { abi } = require(templatePath);
      const network = result.address;
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `${network}`
        )
      );

      const smartcontract = new web3.eth.Contract(abi, contract);

      let balance = await smartcontract.methods.balanceOf(fromWallet).call(function (err, res) {
        if (err) {
          console.log("Ocorreu um erro", err)
          return
        }
        console.log("Saldo gerado com Sucesso")
      });


      const saldo = Web3.utils.fromWei(balance, 'ether');


      if (Number(saldo) >= Number(amount)) {

        const account = web3.eth.accounts.privateKeyToAccount(pk);
        web3.eth.accounts.wallet.add(account);
        web3.eth.defaultAccount = account.address;
        const tx = smartcontract.methods.transfer(toWallet, amountInWei);
        const gas = await tx.estimateGas({ from: account.address });
        const gasPrice = await web3.eth.getGasPrice();
        const data = tx.encodeABI();
        const nonce = await web3.eth.getTransactionCount(account.address);

        const signedTx = await web3.eth.accounts.signTransaction(
          {
            to: contract,
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
        createTransaction("Transfer", amountInWei, toWallet, receipt.transactionHash, account.address, "-", "-")
      } else {
        res.status(400).json({
          Saldo: saldo,
          Solicitado: String(amount)
        });
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async balanceOf(req, res) {
    try {
      const { contract, localhostUrl, wallet } = req.body;
      const result = await Contract.findOne({ where: { contract } })

      const templatePath = path.join(__dirname, '../artifacts/contracts', `${result.name}` + '.sol', `${result.name}` + '.json');
      const { abi } = require(templatePath);
      const network = result.address;
      var web3 = new Web3(`${network}`);

      var contratoInteligente = new web3.eth.Contract(abi, `${contract}`);

      let balance = await contratoInteligente.methods.balanceOf(wallet).call(function (err, res) {
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
      const { contract } = req.body;
      const result = await Contract.findOne({ where: { contract } })
      console.log(result)

      const templatePath = path.join(__dirname, '../artifacts/contracts', `${result.name}` + '.sol', `${result.name}` + '.json');
      const { abi } = require(templatePath);
      const network = result.address;
      var web3 = new Web3(`${network}`);
      const contratoInteligente = new web3.eth.Contract(abi, contract);
      const owner = await contratoInteligente.methods.owner().call();
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
      res.status(200).send({ Symbol: symbol });
    } catch (error) {
      console.error("Erro ao obter o símbolo do token:", error);
      throw error;
    }
  }
}   