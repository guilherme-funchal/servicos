const Contract = require('../models/contract');
//import { PostgresDialect } from '@sequelize/postgres';
const { Sequelize, DataTypes, Op } = require("sequelize");

module.exports = {
  async create(req, res) {
    try {
      const { contract, wallet, date } = req.body
      const data = await Contract.findOne({ where: { contract } })
      
      if (data) {
        res.status(201).json({ message: "Já existe este dado" })
      } else {
        const data = await Contract.create({ contract, wallet, date  })
        res.status(200).json({ data })
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params
      const { contract, wallet, date} = req.body
      const dado = await Contract.findOne({ where: { id } })
      if (!dado) {
        res.status(401).json({ message: "Nenhum dado encontrado" })
      } else {
        const dado = await Contract.update({ contract, wallet, date }, { where: { id } })
        res.status(200).json({ dado })
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async list(req, res) {
    try {
      const dado = await Contract.findAll();
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
    const { id } = req.params
    const dado = await Contract.findOne({ where: { id } })
    if (!dado) {
      res.status(401).json({ message: 'Dado não encontrado' })
    } else {
      await dado.destroy({ where: { id } })
      res.status(200).json({ ok: true })
    }
  },
  async find(req, res) {
    try {
      const { id } = req.params
      const dado = await Contract.findAll({ where: { id } })

      if (!dado) {
        res.status(401).json({ message: 'Não existe dado cadastrado' })
      }
      res.status(200).json({ dado })
    } catch (error) {
      res.status(400).json({ error })
    }
  }
}