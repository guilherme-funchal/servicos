const { Model, DataTypes, Op } = require("sequelize");

class Contract extends Model {
  static init(sequelize) {
    super.init({
      contract: DataTypes.STRING,
      wallet: DataTypes.STRING,
      name: DataTypes.STRING,
      host: DataTypes.STRING,
      address: DataTypes.STRING,
    }, {
      tableName: 'contracts',
      sequelize
    })
  }
}

module.exports = Contract