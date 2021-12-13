/*
This file provide a overview for the structure of the backend,
and links each server components together
*/

import "dotenv/config";
import express from "express";
import session from "express-session";
var passport = require("passport");
require("./config/passport");

//import express as the framwork for the router and endpoints
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "Deeply4-Showplace-Overcoat",
    resave: true,
    saveUninitialized: false,
  })
); // TODO: CRITICAL!!! CHANGE THIS TO LOAD FROM ENV
app.use(passport.initialize());
app.use(passport.session());
// Catch the case where there is an error and log the user out for safety
app.use(function (err, req, res, next) {
  if (err) {
    req.logout();
    if (req.originalUrl == "/login") {
      next(); // never redirect login page to itself
    } else {
      res.redirect("/login");
    }
  } else {
    next();
  }
});

//enable CORS by using middleware
const cors = require("cors");
app.use(cors());

//calls router.js, where the program handles all the requests from the frontend
var router = require("./routes/router");

app.use("/", router);

//response for success and fail to connect
app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});

app.use((req, res) => {
  res.status(404).send("404: Page not found");
});

module.exports = app;
