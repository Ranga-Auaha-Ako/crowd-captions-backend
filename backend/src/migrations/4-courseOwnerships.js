'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "courseOwnerships", deps: [Users, CaptionFiles]
 *
 **/

var info = {
    "revision": 4,
    "name": "noname",
    "created": "2021-12-20T02:46:01.302Z",
    "comment": ""
};

var migrationCommands = [{
    fn: "createTable",
    params: [
        "courseOwnerships",
        {
            "createdAt": {
                "type": Sequelize.DATE,
                "field": "createdAt",
                "allowNull": false
            },
            "updatedAt": {
                "type": Sequelize.DATE,
                "field": "updatedAt",
                "allowNull": false
            },
            "UserUpi": {
                "type": Sequelize.STRING(128),
                "field": "UserUpi",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "Users",
                    "key": "upi"
                },
                "primaryKey": true
            },
            "CaptionFileLectureId": {
                "type": Sequelize.STRING(100),
                "field": "CaptionFileLectureId",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "CaptionFiles",
                    "key": "lecture_id"
                },
                "primaryKey": true
            }
        },
        {}
    ]
}];

module.exports = {
    pos: 0,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
