const express = require('express');
const { exec } = require('child_process');
const Contract = require('../models/contract');
const Token = require('../models/token');
const path = require('path');
const fs = require("fs");
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { Web3 } = require('web3');
const dotenv = require('dotenv');
// database.js
const { Pool } = require('pg');
const moment = require('moment');

// Configure a conexão com o banco de dados PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

require('dotenv').config();

async function createHistory(contract, wallet, name, host, address) {
  const result = await Contract.create({ contract, wallet, name, host, address })
}

async function getPK(token) {
  try {
    const result = await Token.findOne({ where: { token } })
    return result.pk
  } catch (error) {
    console.log("Wallet e PK não existem no BD");
  }
}

module.exports = {
  async deploy(req, res) {
    const { name, wallet, host, address } = req.body;
    let privateKey = await getPK(wallet);
    try {
      const newFilePath = path.join(__dirname, '../contracts', name + '.sol');
      const deployScript = path.join(__dirname, '../scripts', 'deploy.js');
      
      const command = `PRIVATE_KEY=${privateKey} NAME=${name} npx hardhat run ${deployScript} --network ${host}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return res.status(500).json({ error: 'Deployment failed' });
        }

        const match = stdout.match(/Contract nunber: (0x[a-fA-F0-9]{40})/);
        if (match) {
          const contractAddress = match[1];
          res.json({ contractAddress });
          let test = fs.unlinkSync(newFilePath);
          const command = `PRIVATE_KEY=${privateKey} NAME=${name} npx hardhat run ${deployScript} --network localhost`;

          createHistory(contractAddress, wallet, name, host, address);

        } else {
          res.status(500).json({ error: 'Failed to get contract address' });
        }
      });
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async deployFile(req, res) {
    const { filename, wallet, host, address } = req.body;
    let privateKey = await getPK(wallet);
    try {
      const newFilePath = path.join(__dirname, '../contracts', filename + '.sol');
      const deployScript = path.join(__dirname, '../scripts', 'deployfilename.js');
      const command = `PRIVATE_KEY=${privateKey} FILENAME=${filename} npx hardhat run ${deployScript} --network ${host}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return res.status(500).json({ error: 'Deployment failed' });
        }

        const match = stdout.match(/Contract nunber: (0x[a-fA-F0-9]{40})/);
        if (match) {
          const contractAddress = match[1];
          res.json({ contractAddress });
          let test = fs.unlinkSync(newFilePath);
          const command = `PRIVATE_KEY=${privateKey} FILENAME=${filename} npx hardhat run ${deployScript} --network localhost`;

          createHistory(contractAddress, wallet, filename, host, address);

        } else {
          res.status(500).json({ error: 'Failed to get contract address' });
        }
      });
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async createFile(req, res) {
    const { name, symbol, template, baseURI } = req.body;
    let contractContent = "";

    try {

      if (!name) {
        res.status(401).json({ message: "Não existe" })
      } else {
        const templatePath = path.join(__dirname, '../templates', template + 'Template.sol');
        const randomChars = crypto.randomBytes(6).toString('hex').slice(0, 10);
        const newFileName = `${name}.sol`;
        const newFilePath = path.join(__dirname, '../contracts', newFileName);

        fs.readFile(templatePath, 'utf8', (err, data) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to read template file' });
          }

          if (template == "ERC20") {
            contractContent = data.replace(/{{Name}}/g, name)
              .replace(/{{Symbol}}/g, symbol);
          } else if (template == "ERC721") {
            contractContent = data.replace(/{{Name}}/g, name)
              .replace(/{{baseURI}}/g, baseURI)
              .replace(/{{Symbol}}/g, symbol);
          } else {
            return res.status(500).json({ error: 'Template not found' });
          }

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
}    