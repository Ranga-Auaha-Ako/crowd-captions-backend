"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Edit, courseOwnerships, Report }) {
      // define association here
      this.hasMany(Edit);
      this.hasMany(Report);
      this.hasMany(courseOwnerships);
    }
  }
  User.init(
    {
      // 0=Student, 1=CourseAdmin, 2=SuperAdmin, -1=Disabled User
      access: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      upi: {
        type: DataTypes.STRING(128),
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
