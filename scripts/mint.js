const hre = require("hardhat");
const fs = require('fs');
const ethers = require('ethers'); // Importando diretamente a biblioteca ethers
require('dotenv').config();

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    // Carregar a ABI do contrato
    const contractJSON = JSON.parse(fs.readFileSync('./abi/teste.json', 'utf8'));
    const contractABI = contractJSON.abi;
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    // Verificação de integridade da ABI e endereço do contrato
    if (!contractABI) {
        throw new Error("ABI não encontrada no arquivo JSON");
    }
    if (!contractAddress) {
        throw new Error("Endereço do contrato não fornecido");
    }

    const erc20Contract = new hre.ethers.Contract(contractAddress, contractABI, deployer);

    // Endereço do destinatário e quantidade a ser mintada
    const recipientAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const mintAmount = 100000;  // Usando ethers diretamente

    // Executa a transação de minting
    const tx = await erc20Contract.mint(recipientAddress, mintAmount);
    console.log('Transaction Hash:', tx.hash);

    const receipt = await tx.wait();
    console.log('Tokens minted successfully:', receipt);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
