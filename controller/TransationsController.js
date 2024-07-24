const Transaction = require('../models/transact');
//import { PostgresDialect } from '@sequelize/postgres';
const { Sequelize, DataTypes, Op } = require("sequelize");

module.exports = {
  async create(req, res) {
    try {
      const { type, value, fromwallet, hash, towallet, tokenuri, tokenid } = req.body
      const data = await Transaction.findOne({ where: { hash } })
      
      if (data) {
        res.status(201).json({ message: "Já existe este dado" })
      } else {
        const data = await Transaction.create({ type, value, fromwallet, hash, towallet, tokenuri, tokenid })
        res.status(200).json({ data })
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async update(req, res) {
    try {
      const { hash } = req.params
      const { type, value, fromwallet, towallet, tokenuri, tokenid } = req.body
      const dado = await Transaction.findOne({ where: { hash } })
      if (!dado) {
        res.status(401).json({ message: "Nenhum dado encontrado" })
      } else {
        const dado = await Transaction.update({ type, value, fromwallet, towallet, tokenuri, tokenid  }, { where: { hash } })
        res.status(200).json({ dado })
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async list(req, res) {
    try {
      const dado = await Transaction.findAll();
      if (!dado) {
        res.status(401).json({ message: 'Não existe dado cadastrada' })
      }
      //res.status(200).json({ cidades })
      res.status(200).json(dado);
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async delete(req, res) {
    const { hash } = req.params
    const dado = await Transaction.findOne({ where: { hash } })
    if (!dado) {
      res.status(401).json({ message: 'Dado não encontrado' })
    } else {
      await dado.destroy({ where: { hash } })
      res.status(200).json({ ok: true })
    }
  },
  async find(req, res) {
    try {
      const { hash } = req.params
      const dado = await Transaction.findAll({ where: { hash } })

      if (!dado) {
        res.status(401).json({ message: 'Não existe dado cadastrado' })
      }
      res.status(200).json({ dado })
    } catch (error) {
      res.status(400).json({ error })
    }
  }
}