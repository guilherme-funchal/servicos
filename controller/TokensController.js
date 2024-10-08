const Token = require('../models/token');
//import { PostgresDialect } from '@sequelize/postgres';
const { Sequelize, DataTypes, Op } = require("sequelize");

module.exports = {
  async create(req, res) {
    try {
      const { token, pk, email, profile } = req.body
      const data = await Token.findOne({ where: { pk } })
      
      if (data) {
        res.status(201).json({ message: "Já existe este dado" })
      } else {
        const data = await Token.create({ token, pk, email, profile })
        res.status(200).json({ data })
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params
      const { token, pk, email, profile } = req.body
      const dado = await Token.findOne({ where: { id } })
      if (!dado) {
        res.status(401).json({ message: "Nenhum dado encontrado" })
      } else {
        const dado = await Token.update({ token, pk, email, profile  }, { where: { id } })
        res.status(200).json({ dado })
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async list(req, res) {
    try {
      const dado = await Token.findAll();
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
    const dado = await Token.findOne({ where: { id } })
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
      const dado = await Token.findAll({ where: { id } })

      if (!dado) {
        res.status(401).json({ message: 'Não existe dado cadastrado' })
      }
      res.status(200).json({ dado })
    } catch (error) {
      res.status(400).json({ error })
    }
  }
}