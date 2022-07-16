/*
This file provide a overview for the structure of the backend,
and links each server components together
*/

import "dotenv/config";
import express from "express";
import session from "express-session";
const { sequelize } = require("./models");
var cookieSession = require("cookie-session");
var passport = require("passport");
require("./config/passport");
const env = process.env.NODE_ENV || "development";
const config = require("./config/config.js")[env];
const sessionStore = require("./utilities/sequelizeStore");

// Initialise Winston for logging
const auditLogger = require("./utilities/log");

auditLogger.info("Initialised Winston audit logging");

//import express as the framwork for the router and endpoints
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

sessionStore.sync();

app.use(
  session({
    secret: config.jwt_secret,
    store: sessionStore,
    resave: false, // we support the touch method so per the express-session docs this should be set to false
    proxy: true, // if you do SSL outside of node.
    saveUninitialized: false, // don't create new sessions for unauthenticated users
    // name: "session",
    // keys: [config.jwt_secret],
    // sameSite: "strict",
    // // secure: env !== "development",
    // signed: true,
    // overwrite: true,
    // httpOnly: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
// Catch the case where there is an error and log the user out for safety
app.use(function (err, req, res, next) {
  if (err) {
    if (err === "Your account is disabled") {
      res.status(401);
      return res.send(
        `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Your account is disabled</title>
        <style>
        body {
          text-align: center;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 20px;
          color: #333333;
          line-height: 1.4;
          margin: 0;
          padding: 0;
        }
        </style>
        </head>
        <body>
        <h1>Your account is disabled</h1>
        <p>Your account is disabled. Please contact an administrator.</p>
        <a href="mailto:crowdcaptions@auckland.ac.nz">crowdcaptions@auckland.ac.nz</a>
        </body>
        </html>
        `
      );
    } else {
      req.logout(() => {
        if (req.originalUrl == "/login") {
          next(); // never redirect login page to itself
        } else {
          res.redirect("/login");
        }
      });
    }
  } else {
    next();
  }
});

//enable CORS by using middleware
const cors = require("cors");
app.use(
  cors({
    origin: [`https://${process.env.panopto_host}`],
    credentials: true,
  })
);

//calls router.js, where the program handles all the requests from the frontend
const router = require("./routes/router");
const apiRouter = require("./routes/api");

app.use("/", router);
app.use("/api", passport.authenticate("jwt"), apiRouter);

//response for success and fail to connect
app.listen(process.env.PORT, () => {
  console.log(`App listening at http://localhost:${process.env.PORT}`);
});

app.use((req, res) => {
  res.status(404).send("404: Page not found");
});

module.exports = app;
