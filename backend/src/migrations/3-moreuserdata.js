'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "username" to table "Users"
 * addColumn "name" to table "Users"
 *
 **/

var info = {
    "revision": 3,
    "name": "noname",
    "created": "2021-12-20T02:23:03.148Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "addColumn",
        params: [
            "Users",
            "username",
            {
                "type": Sequelize.STRING(128),
                "field": "username",
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Users",
            "name",
            {
                "type": Sequelize.STRING(128),
                "field": "name",
                "allowNull": true
            }
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
