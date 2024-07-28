const { Model, DataTypes, Op } = require("sequelize");

class User extends Model {
  static init(sequelize) {
    super.init({
      email: DataTypes.STRING,
      wallet: DataTypes.STRING,
      pk: DataTypes.STRING
    }, {
      tableName: 'users',
      sequelize
    })
  }
}

module.exports = User