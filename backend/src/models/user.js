'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Edit }) {
      // define association here
      this.hasMany(Edit);
    }
  }
  User.init(
    {
      access: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      upi: {
        type: DataTypes.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
    }
  );
  return User;
};
