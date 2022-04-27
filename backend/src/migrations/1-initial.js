'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "CaptionFiles", deps: []
 * createTable "courses", deps: []
 * createTable "Users", deps: []
 * createTable "CaptionSentences", deps: [CaptionFiles]
 * createTable "courseOwnerships", deps: [Users]
 * createTable "Edits", deps: [CaptionSentences, Users]
 * createTable "Reports", deps: [Edits, Users]
 * createTable "Votes", deps: [Edits, Users]
 *
 **/

var info = {
    "revision": 1,
    "name": "initial",
    "created": "2022-04-26T23:21:17.447Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "CaptionFiles",
            {
                "lecture_name": {
                    "type": Sequelize.TEXT,
                    "field": "lecture_name",
                    "allowNull": false
                },
                "lecture_id": {
                    "type": Sequelize.STRING(100),
                    "field": "lecture_id",
                    "primaryKey": true,
                    "allowNull": false
                },
                "lecture_folder": {
                    "type": Sequelize.STRING(100),
                    "field": "lecture_folder",
                    "allowNull": true
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
            "courses",
            {
                "courseName": {
                    "type": Sequelize.STRING,
                    "field": "courseName",
                    "allowNull": false
                },
                "timePeriod": {
                    "type": Sequelize.STRING,
                    "field": "timePeriod",
                    "allowNull": false
                },
                "courseId": {
                    "type": Sequelize.STRING,
                    "field": "courseId",
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
                "email": {
                    "type": Sequelize.STRING(255),
                    "field": "email",
                    "allowNull": false
                },
                "upi": {
                    "type": Sequelize.STRING(128),
                    "field": "upi",
                    "primaryKey": true,
                    "allowNull": false
                },
                "name": {
                    "type": Sequelize.STRING(128),
                    "field": "name",
                    "allowNull": true
                },
                "username": {
                    "type": Sequelize.STRING(128),
                    "field": "username",
                    "allowNull": true
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
                    "type": Sequelize.DOUBLE PRECISION,
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
            "courseOwnerships",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "lecture_folder": {
                    "type": Sequelize.STRING(100),
                    "field": "lecture_folder",
                    "allowNull": false
                },
                "folder_name": {
                    "type": Sequelize.STRING(100),
                    "field": "folder_name",
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
