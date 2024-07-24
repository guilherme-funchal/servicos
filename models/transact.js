const { Model, DataTypes, Op } = require("sequelize");

class Transact extends Model {
  static init(sequelize) {
    super.init({
      type: DataTypes.STRING, 
      value: DataTypes.STRING, 
      fromwallet: DataTypes.STRING, 
      hash: DataTypes.STRING, 
      towallet: DataTypes.STRING, 
      tokenuri: DataTypes.STRING, 
      tokenid: DataTypes.STRING,
    }, {
      tableName: 'transactions',
      sequelize
    })
  }
}

module.exports = Transact