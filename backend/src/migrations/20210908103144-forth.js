'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('CaptionSentence', {
      id: {
        type: DataTypes.UUID,
        allowNull: false
      },
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
      },
      lectureID: {
        type: DataTypes.STRING(200)
      }
    });

    await queryInterface.createTable('Edit', {
      id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      body: {
        type: DataTypes.STRING(200)
      },
      approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      votes: {
        type: DataTypes.INTEGER,
      },
      position: {
        type: DataTypes.INTEGER,
      },
      reports: {
        type: DataTypes.INTEGER,
      },
      UPI: {
        type: DataTypes.INTEGER,
      },
      timeStamp: {
        type: DataTypes.DATE,
      }
    });

    await queryInterface.createTable('Vote', {
      editId: {
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
      },
      upvoted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      }
    });

    await queryInterface.createTable('Vote', {
      editId: {
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
