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
  console.log(record.get("courseAdmins"));
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
const ownsEditCourse = ({ currentAdmin, record }) => {
  return (
    isSuperAdmin({ currentAdmin }) ||
    currentAdmin.upi ===
      record.param("CaptionSentence.CaptionFile.courseAdmins")
  );
};
const ownsReport = ({ currentAdmin, record }) => {
  console.log(record.param("Edit.CaptionSentence.CaptionFile.courseAdmins"));
  return (
    isSuperAdmin({ currentAdmin }) ||
    currentAdmin.upi ===
      record.param("Edit.CaptionSentence.CaptionFile.courseAdmins")
  );
};

AdminJS.registerAdapter(AdminJSSequelize);
const admin = new AdminJS({
  rootPath: "/admin",
  dashboard: {
    component: AdminJS.bundle("../component/dashboard.jsx"),
    component: AdminJS.bundle("../component/courseList.jsx"),
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
        editProperties: ["upi", "name", "username", "email", "access"],
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
    {
      resource: db.Edit,
      actions: {
        edit: { isAccessible: ownsEditCourse },
        delete: { isAccessible: ownsEditCourse },
        new: { isAccessible: ownsEditCourse },
        list: { isAccessible: ownsEditCourse },
      },
    },
    {
      resource: db.courses,
      actions: {
        edit: { isAccessible: isSuperAdmin },
        delete: { isAccessible: isSuperAdmin },
        new: { isAccessible: isSuperAdmin },
        list: { isAccessible: isSuperAdmin },
      },
    },
    {
      resource: db.CaptionSentence,
      actions: {
        edit: { isAccessible: ownsCaptionsCourse },
        delete: { isAccessible: ownsCaptionsCourse },
        new: { isAccessible: ownsCaptionsCourse },
        list: { isAccessible: ownsCaptionsCourse },
      },
    },
    {
      resource: db.courseOwnerships,
      actions: {
        edit: { isAccessible: false },
        delete: { isAccessible: false },
        new: { isAccessible: false },
        list: { isAccessible: true },
      },
    },
    {
      resource: db.Report,
      actions: {
        edit: { isAccessible: ownsReport },
        delete: { isAccessible: ownsReport },
        new: { isAccessible: ownsReport },
        list: { isAccessible: ownsReport },
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
  if (req.isAuthenticated() && req.user.access > 0) {
    req.session.adminUser = req.user;
    next();
  } else {
    res.status(401);
    res.send(`<a href="/login">Please log in to continue</a>`)
    // res.redirect("/login");
  }
});

router.use("/logout", (req, res) => res.redirect("/logout"));

router = AdminJSExpress.buildRouter(admin, router);

module.exports = router;
