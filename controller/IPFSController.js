const express = require('express');
const { exec } = require('child_process');
const File = require('../models/file');
const Token = require('../models/token');
const path = require('path');
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { Web3 } = require('web3');
const dotenv = require('dotenv');
const moment = require('moment');
const { create } = require('ipfs-http-client');
const multer = require('multer');
const bodyParser = require('body-parser');
const { fileURLToPath } = require('url');
const util = require("util");
const upload = require("../middlewares/upload-middlewareFile");

dotenv.config();

// Conectar ao IPFS existente
const ipfs = create({ url: process.env.IPFS_API_URL || 'http://localhost:5001' });

// Função para verificar se o arquivo está pinado
const checkFilePinned = async (hash) => {
    try {
        // Obter a lista de arquivos pinados
        const pinnedFiles = [];
        for await (const file of ipfs.pin.ls()) {
            pinnedFiles.push(file.cid.toString());
        }

        // Verificar se o hash está na lista de arquivos pinados
        return pinnedFiles.includes(hash);
    } catch (error) {
        throw new Error(`Erro ao verificar se o arquivo está pinado: ${error.message}`);
    }
};


// Função para adicionar metadados ao banco de dados
const addMetadata = async (hash, metadata) => {
    try {
        let filecid = await ipfs.add(JSON.stringify(metadata));
        filecid = filecid.path;

        const result = await File.findOne({ where: { hash } })
            .then(user => {
                if (user) {
                    console.log('Arquivo existe');
                } else {
                    File.create({ hash: hash, filecid: filecid });
                }
            })
            .catch(error => {
                console.error('Erro ao buscar arquivo:', error);
            });
        return `ipfs://${filecid}`;
    } catch (error) {
        throw new Error(`Erro ao adicionar metadados: ${error.message}`);
    }
};

// Função para carregar tokens autorizados do banco de dados
async function loadAuthorizedTokens() {
    const res = await pool.query('SELECT token FROM tokens');
    return res.rows.map(row => row.token);
}

// Função para listar todos os arquivos pinados no IPFS
const listPinnedFiles = async () => {
    try {
        const pinnedFiles = [];
        for await (const file of ipfs.pin.ls()) {
            pinnedFiles.push(file.cid.toString());
        }
        return pinnedFiles;
    } catch (error) {
        throw new Error(`Erro ao listar arquivos pinados: ${error.message}`);
    }
};

// Middleware para verificar o token em todas as rotas
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    const authorizedTokens = await loadAuthorizedTokens();

    if (!token || !authorizedTokens.includes(token)) {
        return res.sendStatus(401); // Unauthorized
    }
    next();
}

async function getMetadataByHash(cid) {
    try {
        const stream = ipfs.cat(cid);
        let data = '';

        for await (const chunk of stream) {
            data += chunk.toString(); // Converte o Buffer para uma string
        }

        const jsonData = JSON.parse(data); // Converte a string JSON em um objeto
        return jsonData;
    } catch (error) {
        console.error('Erro ao buscar metadata:', error);
        return null;
    }
}

module.exports = {
    async files(req, res) {
        try {
            const pinnedFiles = await listPinnedFiles();

            if (pinnedFiles.length === 0) {
                // Retornar resposta vazia se nenhum arquivo estiver pinado
                return res.status(201).send();
            }

            res.json(pinnedFiles);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async upload(req, res) {
        try {
            const file = req.file;
            const filePath = path.join(__dirname, "../", file.path);
            const fileBuffer = await fs.promises.readFile(filePath);
            const uploadResult = await ipfs.add(fileBuffer);
            const sizeInKilobytes = (uploadResult.size / 1024).toFixed(2);

            res.json({
                cid: `ipfs://${uploadResult.path}`, // CID do arquivo no IPFS
                size: sizeInKilobytes, // Tamanho do arquivo em kilobytes
                success: true
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }

    },
    async fetch(req, res) {
        try {
            const hash = req.params.hash;

            // Verificar se o arquivo está pinado
            const isPinned = await checkFilePinned(hash);

            if (!isPinned) {
                return res.status(404).json({ message: `Arquivo com hash ${hash} não está mais pinado e não está disponível no IPFS.` });
            }

            // Se o arquivo está pinado, buscar o conteúdo
            const stream = ipfs.cat(hash);
            let data = [];

            for await (const chunk of stream) {
                data.push(chunk);
            }

            res.send(Buffer.concat(data).toString());
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async deleteFile(req, res) {
        try {
            const hash = req.params.hash;
            const dado = await File.findOne({ where: { hash } })
            await ipfs.pin.rm(hash);
            await ipfs.pin.rm(dado.filecid);
            await dado.destroy({ where: { filecid: dado.filecid } })

            res.status(200).json({ message: `Arquivo com hash excluído do IPFS e metadados removidos.` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async deleteMetada(req, res) {
        try {
            const filecid = req.params.filecid;

            const dado = await File.findOne({ where: { filecid : filecid } })

            const hash = dado.hash;
            await ipfs.pin.rm(filecid);
            await ipfs.pin.rm(hash);
            await dado.destroy({ where: { filecid } })

            res.status(200).json({ message: `Arquivo com filecid excluído do IPFS.` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async uploadMetadata(req, res) {
        try {
            const metadata = req.body;

            if (!metadata) {
                return res.status(400).json({ message: 'URL do IPFS e metadados são necessários.' });
            }

            // Extrair o hash da URL do IPFS
            const hashMatch = metadata.image.match(/^ipfs:\/\/(.+)$/);

            if (!hashMatch) {
                return res.status(400).json({ message: 'URL do IPFS inválida. Deve estar no formato ipfs://hash.' });
            }

            const hash = hashMatch[1];

            // Adicionar metadados ao banco de dados
            const tokenURI = await addMetadata(hash, metadata);

            res.status(200).json({ tokenURI });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async metadata(req, res) {
        try {
            const hash = req.params.hash;
            // Se o arquivo está pinado, buscar o conteúdo
            const stream = ipfs.cat(hash);
            let data = [];

            for await (const chunk of stream) {
                data.push(chunk);
            }

            res.send(Buffer.concat(data).toString());
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}