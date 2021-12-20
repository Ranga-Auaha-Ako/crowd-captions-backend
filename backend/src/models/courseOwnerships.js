'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class courseOwnerships extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, CaptionFile }) {
      // define association here
      this.belongsTo(User);
      this.belongsTo(CaptionFile);
    }
  }
  courseOwnerships.init(
    {},
    {
      sequelize,
      modelName: 'courseOwnerships',
    }
  );
  return courseOwnerships;
};