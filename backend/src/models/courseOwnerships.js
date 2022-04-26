"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class courseOwnerships extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User }) {
      // define association here
      this.belongsTo(User);
    }
  }
  courseOwnerships.init(
    {
      // User folders rather than individual Panopto sessions
      lecture_folder: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      folder_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "courseOwnerships",
    }
  );
  return courseOwnerships;
};
