const { Model, DataTypes, Op } = require("sequelize");

class Token extends Model {
  static init(sequelize) {
    super.init({
      token: DataTypes.STRING,
      pk: DataTypes.STRING,
    }, {
      tableName: 'tokens',
      sequelize
    })
  }
}

module.exports = Token