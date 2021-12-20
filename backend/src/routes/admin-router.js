const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const AdminJSSequelize = require("@adminjs/sequelize");

var passport = require("passport");
require("../config/passport");

const express = require("express");
const app = express();
const db = require("../models");

const isSuperAdmin = ({ currentAdmin }) =>
  currentAdmin && currentAdmin.access === 2;
const ownsCourse = ({ currentAdmin, record }) => {
  return (
    isSuperAdmin({ currentAdmin }) ||
    currentAdmin.upi === record.get("courseAdmins")
  );
};
const ownsCaptionsCourse = ({ currentAdmin, record }) => {
  return (
    isSuperAdmin({ currentAdmin }) ||
    currentAdmin.upi === record.param("CaptionFile.courseAdmins")
  );
};

AdminJS.registerAdapter(AdminJSSequelize);
const admin = new AdminJS({
  rootPath: "/admin",
  dashboard: {
    component: AdminJS.bundle("../component/dashboard.jsx"),
  },
  resources: [
    {
      resource: db.User,
      options: {
        properties: {
          access: {
            availableValues: [
              { value: -1, label: "Disabled" },
              { value: 0, label: "Student" },
              { value: 1, label: "Lecturer" },
              { value: 2, label: "SuperAdmin" },
            ],
          },
        },
        listProperties: ["name", "email", "access"],
        editProperties: [
          "upi",
          "name",
          "username",
          "email",
          "access",
          "OwnedCourse",
        ],
        showProperties: ["name", "username", "email", "access"],
        actions: {
          edit: { isAccessible: isSuperAdmin },
          delete: { isAccessible: isSuperAdmin },
          new: { isAccessible: isSuperAdmin },
          list: { isAccessible: isSuperAdmin },
        },
      },
    },
    {
      resource: db.CaptionFile,
      actions: {
        edit: { isAccessible: ownsCourse },
        delete: { isAccessible: ownsCourse },
        new: { isAccessible: ownsCourse },
        list: { isAccessible: ownsCourse },
      },
    },
  ],
  branding: {
    companyName: "Crowd Captions",
    softwareBrothers: false,
    logo: false,
  },
  loginPath: "/login",
  logoutPath: "/logout",
});

let router = express.Router();

router.use((req, res, next) => {
  console.log(req.user);
  if (req.isAuthenticated() && req.user.access > 0) {
    req.session.adminUser = req.user;
    next();
  } else {
    res.status(401);
    res.redirect("/login");
  }
});

router.use("/logout", (req, res) => res.redirect("/logout"));

router = AdminJSExpress.buildRouter(admin, router);

module.exports = router;
