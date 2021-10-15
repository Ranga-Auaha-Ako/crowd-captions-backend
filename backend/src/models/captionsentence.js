"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CaptionSentence extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ CaptionFile, Edit }) {
      // define association here
      this.hasMany(Edit);
    }
  }
  CaptionSentence.init(
    {
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Milliseconds from the start of the video
      start: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      body: {
        type: DataTypes.STRING(200),
      },
    },
    {
      sequelize,
      modelName: "CaptionSentence",
    }
  );
  return CaptionSentence;
};
