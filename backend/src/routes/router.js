/*
This file contains all the end points, each will calls a function in controller/endPoints.js
for data processing, database accessing and modification
*/

// Import modules
const express = require("express");
const router = express.Router();
var passport = require("passport");
require("../config/passport");
const jwt = require("jsonwebtoken");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];

//handle request which access to root
router.get("/", async (req, res) => {
  // await sequelize.sync({ force: true });

  // populate the database with mock data, for testing purpose
  //await captionFileData(CaptionFile);
  //await captionSentenceData(CaptionSentence);
  //await userData(User);
  //await editData(Edit);
  //await reportData(Report);
  //await voteData(Vote);

  res.send(`received on port: ${process.env.PORT}`);
});

// Authentication callback route
router.get(
  "/auth/callback",
  passport.authenticate("oauth2", { failureRedirect: "/status?failed" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/auth/jwt");
  }
);

router.get("/login", passport.authenticate("oauth2"), async (req, res) => {
  return res.json({ status: "You are logged in!" });
});

router.get("/auth/jwt", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401);
    return res.json({ status: "User not authenticated" });
  }
  const token = jwt.sign(
    { upi: req.user.upi, accessToken: req.user.accessToken },
    config.jwt_secret,
    {
      expiresIn: "30m",
      issuer: "crowdcaptions.raa.amazon.auckland.ac.nz",
      audience: "api.crowdcaptions.raa.amazon.auckland.ac.nz",
    }
  );
  res.cookie("jwt-auth", token);
  return res.json({ token });
});

router.get("/logout", async (req, res) => {
  req.logout();
  res.redirect("/?loggedout");
});

module.exports = router;
