/*
This file is the entry for the backend program
Currently it only link to server.js, but more files can be added as a import
This can turn each part of the backend into a stand alone component,
and allow easier update/modification
*/

require = require('esm')(module);
module.exports = require('./server.js');
