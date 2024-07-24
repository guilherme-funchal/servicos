const { Model, DataTypes, Op } = require("sequelize");

class Contract extends Model {
  static init(sequelize) {
    super.init({
      contract: DataTypes.STRING,
      wallet: DataTypes.STRING,
      date: DataTypes.DATE
    }, {
      tableName: 'contracts',
      sequelize
    })
  }
}

module.exports = Contract