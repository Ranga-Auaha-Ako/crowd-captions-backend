'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Edit }) {
      // define association here
      this.belongsTo(User);
      this.belongsTo(Edit);
    }
  }
  Report.init(
    {},
    {
      sequelize,
      modelName: 'Report',
    }
  );
  return Report;
};
