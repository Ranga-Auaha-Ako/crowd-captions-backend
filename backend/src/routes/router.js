/*
This file contains all the end points, each will calls a function in controller/endPoints.js
for data processing, database accessing and modification
*/

// Import modules
const express = require("express");
const router = express.Router();
var passport = require("passport");
require("../config/passport");
const { sequelize } = require("../models");
const setToken = require("../utilities/setToken");

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
  // res.send(`received on port: ${process.env.PORT}`);

  // Redirect to Documentation
  res.redirect("https://docs.crowdcaptions.raa.amazon.auckland.ac.nz/");
});

router.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "success",
      user: req.user ? "Authenticated" : "Not Authenticated",
    });
  } catch (err) {
    res.status(500);
    console.error("Unable to connect to the database:", err);
  }
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
  setToken(req.user, res);
  // return res.json({ token });
  return res.send(
    `<!DOCTYPE html><html><head>
      <title>Login successful</title>
    </head><body>
      <p>Login successful, you may now close this window.</p>
      <script type="text/javascript">setTimeout("window.close();", 500);</script>
    </body>
    </html>`
  );
});

router.get("/logout", async (req, res) => {
  req.logout();
  res.redirect("/?loggedout");
});

module.exports = router;
