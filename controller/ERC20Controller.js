const express = require('express');
const fs = require("fs");
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const crypto = require('crypto');
const { Web3 } = require('web3');


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
    const { contractAddress, address, localhostUrl, to, amount, data, coin } = req.body;
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
    const tx = contratoInteligente.methods.mint(to, amountInWei);

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
  },
  async burn(req, res) {
    const { contractAddress, address, localhostUrl, to, amount, data, coin } = req.body;
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
  },
  async transfer(req, res) {
    const { contractAddress, pk, to, value, localhostUrl, coin, wallet } = req.body;
    const amountInWei = Web3.utils.toWei(value, 'ether');

    const templatePath = path.join(__dirname, '../artifacts/contracts', `${coin}` + '.sol', `${coin}` + '.json');
    const { abi } = require(templatePath);
    const network = localhostUrl;
    const web3 = new Web3(
      new Web3.providers.HttpProvider(
        `${network}`
      )
    );

    //console.log("from->", from);

    // const signer = web3.eth.accounts.privateKeyToAccount(
    //   `${from}`
    // );

    // console.log("from->", signer.address);

    //web3.eth.accounts.wallet.add(signer);

    var contract = new web3.eth.Contract(abi, `${contractAddress}`);
    const nonce = await web3.eth.getTransactionCount(wallet, 'latest');
    const gasEstimate = await contract.methods.transfer(to, value).estimateGas({ from: wallet });
    const gasPrice = await web3.eth.getGasPrice();

    const tx = {
      from: wallet,
      to: to,
      nonce: nonce,
      gas: gasEstimate,
      gasPrice: gasPrice,
      data: contract.methods.transfer(to, value).encodeABI()
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, pk);

    let result = web3.eth.sendSignedTransaction(signedTx.rawTransaction)
      .on('receipt', receipt => {
        //console.log('Transação bem-sucedida:', receipt);
        res.status(200).json({
          hash: receipt.transactionHash,
          block: receipt.blockNumber.toString()
        });
      })
      .on('error', error => {
        console.error('Erro na transação:', error);
      });

  },
  async balanceOf(req, res) {
    const { contractAddress, wallet, coin, localhostUrl, address } = req.body;
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
    console.log("Balance:", saldo.toString())
    res.status(200).send({ Balance: saldo });
  }
}        
