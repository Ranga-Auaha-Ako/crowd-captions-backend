'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "courses", deps: []
 * changeColumn "id" on table "Reports"
 *
 **/

var info = {
    "revision": 6,
    "name": "courses",
    "created": "2022-01-28T03:35:13.342Z",
    "comment": ""
};

var migrationCommands = [{
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
