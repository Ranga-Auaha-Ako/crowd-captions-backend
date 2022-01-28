'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class courses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  courses.init({
    courseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timePeriod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    }
  }, {
    sequelize,
    modelName: 'courses',
  });
  return courses;
};