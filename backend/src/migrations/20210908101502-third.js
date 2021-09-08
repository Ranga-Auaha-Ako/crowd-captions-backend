'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('CaptionFile', {
      lecture_id: {
        type: DataTypes.UUID,
        allowNull: false
      }
    });

    await queryInterface.createTable('CaptionSentence', {
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      body: {
        type: DataTypes.STRING(200)
      }
    });

    await queryInterface.createTable('Edit', {
      body: {
        type: DataTypes.STRING(200)
      },
      approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      votes: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      reports: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      }
    });

    await queryInterface.createTable('User', {
      access: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      upi: {
        type: DataTypes.STRING(9),
        allowNull: false
      }
    });

    await queryInterface.createTable('User', {
      upvoted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CaptionFile');
  }
};
