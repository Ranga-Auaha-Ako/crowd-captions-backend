"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Vote extends Model {
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
  Vote.init(
    {
      upvoted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Vote",
    }
  );
  return Vote;
};
