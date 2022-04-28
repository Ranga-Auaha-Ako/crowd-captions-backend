import session from "express-session";
const { sequelize } = require("../models");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
module.exports = new SequelizeStore({
  db: sequelize,
});
