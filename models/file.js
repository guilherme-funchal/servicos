const { Model, DataTypes, Op } = require("sequelize");


class File extends Model {
  static init(sequelize) {
    super.init({
      hash: DataTypes.STRING,
      filecid: DataTypes.STRING
    }, {
      tableName: 'file',
      sequelize
    })
  }
}

module.exports = File