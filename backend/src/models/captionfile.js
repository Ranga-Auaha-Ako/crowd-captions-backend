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
      lecture_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      lecture_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        primaryKey: true,
      },
      lecture_folder: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CaptionFile",
    }
  );
  return CaptionFile;
};
