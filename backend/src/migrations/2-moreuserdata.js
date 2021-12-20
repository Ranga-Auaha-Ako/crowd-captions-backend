'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "email" to table "Users"
 *
 **/

var info = {
    "revision": 2,
    "name": "noname",
    "created": "2021-12-20T02:19:05.667Z",
    "comment": ""
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "Users",
        "email",
        {
            "type": Sequelize.STRING(255),
            "field": "email",
            "allowNull": false
        }
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
