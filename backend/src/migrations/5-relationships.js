"use strict";

var Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * changeColumn "id" on table "Reports"
 * changeColumn "UserUpi" on table "courseOwnerships"
 * changeColumn "UserUpi" on table "courseOwnerships"
 * changeColumn "CaptionFileLectureId" on table "courseOwnerships"
 * changeColumn "CaptionFileLectureId" on table "courseOwnerships"
 *
 **/

var info = {
  revision: 5,
  name: "noname",
  created: "2021-12-22T01:21:44.171Z",
  comment: "",
};

var migrationCommands = [
  {
    fn: "changeColumn",
    params: [
      "courseOwnerships",
      "UserUpi",
      {
        type: Sequelize.STRING(128),
        primaryKey: true,
        field: "UserUpi",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        references: {
          model: "Users",
          key: "upi",
        },
        allowNull: true,
      },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "courseOwnerships",
      "UserUpi",
      {
        type: Sequelize.STRING(128),
        primaryKey: true,
        field: "UserUpi",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        references: {
          model: "Users",
          key: "upi",
        },
        allowNull: true,
      },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "courseOwnerships",
      "CaptionFileLectureId",
      {
        type: Sequelize.STRING(100),
        primaryKey: true,
        field: "CaptionFileLectureId",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        references: {
          model: "CaptionFiles",
          key: "lecture_id",
        },
        allowNull: true,
      },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "courseOwnerships",
      "CaptionFileLectureId",
      {
        type: Sequelize.STRING(100),
        primaryKey: true,
        field: "CaptionFileLectureId",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        references: {
          model: "CaptionFiles",
          key: "lecture_id",
        },
        allowNull: true,
      },
    ],
  },
];

module.exports = {
  pos: 0,
  up: function (queryInterface, Sequelize) {
    var index = this.pos;
    return new Promise(function (resolve, reject) {
      function next() {
        if (index < migrationCommands.length) {
          let command = migrationCommands[index];
          console.log("[#" + index + "] execute: " + command.fn);
          index++;
          queryInterface[command.fn]
            .apply(queryInterface, command.params)
            .then(next, reject);
        } else resolve();
      }
      next();
    });
  },
  info: info,
};
