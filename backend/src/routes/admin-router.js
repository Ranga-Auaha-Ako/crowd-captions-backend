const AdminBro = require("admin-bro");
const AdminBroExpress = require("@admin-bro/express");
const AdminBroSequelize = require("@admin-bro/sequelize");

var passport = require("passport");
require("../config/passport");

const express = require("express");
const app = express();
const db = require("../models");

AdminBro.registerAdapter(AdminBroSequelize);
const adminBro = new AdminBro({
  databases: [db],
  rootPath: "/admin",
  dashboard: {
    component: AdminBro.bundle("../component/dashboard.jsx"),
  },
});

let router = express.Router();
router.use((req, res, next) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    req.session.adminUser = {
      user: req.user?.upi,
      email: `${req.user?.upi}@test.aucklanduni.ac.nz`,
    };
    next();
  } else {
    res.status(401);
    res.json({ status: "User not authenticated" });
  }
});

router.use("/logout", (req, res) => res.redirect("/logout"));

router = AdminBroExpress.buildRouter(adminBro, router);

module.exports = router;
