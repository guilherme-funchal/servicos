const User = require('../models/user');
//import { PostgresDialect } from '@sequelize/postgres';
const { Sequelize, DataTypes, Op } = require("sequelize");

module.exports = {
  async create(req, res) {
    try {
      const { email, wallet, pk} = req.body
      const data = await User.findOne({ where: { email } })
      
      if (data) {
        res.status(201).json({ message: "Já existe este dado" })
      } else {
        const data = await User.create({ email, wallet, pk})
        res.status(200).json({ data })
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async update(req, res) {
    try {
      const { email } = req.params
      const { wallet, pk } = req.body
      const dado = await User.findOne({ where: { email } })
      if (!dado) {
        res.status(401).json({ message: "Nenhum dado encontrado" })
      } else {
        const dado = await User.update({ wallet, pk }, { where: { email } })
        res.status(200).json({ dado })
      }
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async list(req, res) {
    try {
      const dado = await User.findAll();
      if (!dado) {
        res.status(401).json({ message: 'Não existe dado cadastrada' })
      }
      res.status(200).json(dado);
    } catch (error) {
      res.status(400).json({ error })
    }
  },
  async delete(req, res) {
    const { email } = req.params
    const dado = await User.findOne({ where: { email } })
    if (!dado) {
      res.status(401).json({ message: 'Dado não encontrado' })
    } else {
      await dado.destroy({ where: { email } })
      res.status(200).json({ ok: true })
    }
  },
  async find(req, res) {
    try {
      const { email } = req.params
      const dado = await User.findAll({ where: { email } })

      if (!dado) {
        res.status(401).json({ message: 'Não existe dado cadastrado' })
      }
      res.status(200).json({ dado })
    } catch (error) {
      res.status(400).json({ error })
    }
  }
}