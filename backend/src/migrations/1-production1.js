'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "CaptionFiles", deps: []
 * createTable "Users", deps: []
 * createTable "CaptionSentences", deps: [CaptionFiles]
 * createTable "Edits", deps: [CaptionSentences, Users]
 * createTable "Reports", deps: [Users, Edits]
 * createTable "Votes", deps: [Users, Edits]
 *
 **/

var info = {
    "revision": 1,
    "name": "production1",
    "created": "2021-12-15T09:04:22.849Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "CaptionFiles",
            {
                "lecture_id": {
                    "type": Sequelize.STRING(100),
                    "field": "lecture_id",
                    "primaryKey": true,
                    "allowNull": false
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Users",
            {
                "access": {
                    "type": Sequelize.INTEGER,
                    "field": "access",
                    "defaultValue": 0,
                    "allowNull": false
                },
                "upi": {
                    "type": Sequelize.STRING(128),
                    "field": "upi",
                    "primaryKey": true,
                    "allowNull": false
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "CaptionSentences",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "position": {
                    "type": Sequelize.INTEGER,
                    "field": "position",
                    "allowNull": false
                },
                "start": {
                    "type": Sequelize.DOUBLE,
                    "field": "start",
                    "allowNull": false
                },
                "body": {
                    "type": Sequelize.STRING(200),
                    "field": "body"
                },
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
                "CaptionFileLectureId": {
                    "type": Sequelize.STRING(100),
                    "field": "CaptionFileLectureId",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "CaptionFiles",
                        "key": "lecture_id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Edits",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "body": {
                    "type": Sequelize.STRING(200),
                    "field": "body"
                },
                "approved": {
                    "type": Sequelize.BOOLEAN,
                    "field": "approved",
                    "defaultValue": false,
                    "allowNull": false
                },
                "blocked": {
                    "type": Sequelize.BOOLEAN,
                    "field": "blocked",
                    "defaultValue": false,
                    "allowNull": false
                },
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
                "CaptionSentenceId": {
                    "type": Sequelize.INTEGER,
                    "field": "CaptionSentenceId",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "CaptionSentences",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "UserUpi": {
                    "type": Sequelize.STRING(128),
                    "field": "UserUpi",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Users",
                        "key": "upi"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Reports",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
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
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Users",
                        "key": "upi"
                    },
                    "allowNull": true
                },
                "EditId": {
                    "type": Sequelize.INTEGER,
                    "field": "EditId",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Edits",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Votes",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "upvoted": {
                    "type": Sequelize.BOOLEAN,
                    "field": "upvoted",
                    "defaultValue": true,
                    "allowNull": false
                },
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
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Users",
                        "key": "upi"
                    },
                    "allowNull": true
                },
                "EditId": {
                    "type": Sequelize.INTEGER,
                    "field": "EditId",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Edits",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    }
];

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
