const { Model, DataTypes, Op } = require("sequelize");

class User extends Model {
  static init(sequelize) {
    super.init({
      email: DataTypes.STRING,
      cpf: DataTypes.STRING,
      simpleAccount: DataTypes.STRING,
      privateKey: DataTypes.STRING,
      publicKey: DataTypes.STRING,
    }, {
      tableName: 'users',
      sequelize
    })
  }
}

module.exports = User