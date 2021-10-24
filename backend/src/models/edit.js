'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Edit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ CaptionSentence, User }) {
      // define association here
      this.belongsTo(CaptionSentence);
      this.belongsTo(User);
    }
  }
  Edit.init(
    {
      body: {
        type: DataTypes.STRING(200),
      },
      reports: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Edit',
    }
  );
  return Edit;
};
