"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CaptionFile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ CaptionSentence }) {
      // define association here
      this.hasMany(CaptionSentence);
    }
  }
  CaptionFile.init(
    {
      lecture_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CaptionFile",
    }
  );
  return CaptionFile;
};
