require('dotenv').config();


const Sequelize = require('sequelize');
const configDB = require('../config/database');


const Token = require('../models/token')
const Contract = require('../models/contract')
const Transact = require('../models/transact')

const connection = new Sequelize(configDB)

Token.init(connection)
Contract.init(connection)
Transact.init(connection)

module.exports = connection
