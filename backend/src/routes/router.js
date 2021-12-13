/*
This file contains all the end points, each will calls a function in controller/endPoints.js
for data processing, database accessing and modification
*/

// Import modules
const express = require("express");
const router = express.Router();
var passport = require("passport");
require("../config/passport");

// Import models as database relations
const {
  sequelize,
  CaptionFile,
  CaptionSentence,
  Edit,
  Report,
  User,
  Vote,
} = require("../models");

// Import mock data functions fron routerData
const {
  captionFileData,
  captionSentenceData,
  editData,
  reportData,
  userData,
  voteData,
  createCaption,
} = require("../data.test/routerData.test");

// Import controller from endPoints
const {
  getCaptions,
  getEdits,
  postEdits,
  postVotes,
  postReports,
} = require("../controller/endPoints");

//handle request which access to root
router.get("/", passport.authenticate("oauth2"), async (req, res) => {
  await sequelize.sync({ force: true });

  // populate the database with mock data, for testing purpose
  await captionFileData(CaptionFile);
  await captionSentenceData(CaptionSentence);
  await userData(User);
  await editData(Edit);
  await reportData(Report);
  await voteData(Vote);

  res.send(`received on port: ${process.env.PORT}`);
});

// Authentication callback route
router.get(
  "/auth/callback",
  passport.authenticate("oauth2", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/success");
  }
);

// Test with id: 9592f9fc-0af4-49b8-9e38-ad6b004d17df
router.get("/captions/:lectureId/:upi", async (req, res) => {
  let { lectureId, upi } = req.params;

  await getCaptions(lectureId, upi).then((result) => {
    return res.json(result);
  });
});

//query the edits of one sentence
router.get("/edits/:sentenceId/:upi", async (req, res) => {
  let { sentenceId, upi } = req.params;

  await getEdits(sentenceId, upi).then((result) => {
    if (result == "Caption sentence not found") {
      return res.status(404).send(result);
    } else {
      console.log(result);
      return res.json(result);
    }
  });
});

//insert new edits into the database
router.post("/edit", async (req, res) => {
  const { sentenceId, body, upi } = req.body;

  await postEdits(sentenceId, body, upi).then((result) => {
    if (result == "Caption Sentence does not exist") {
      return res.status(404).send(result);
    } else if (result == "Edit should be less than 200 chracters") {
      return res.send(result);
    } else {
      return res.json(result);
    }
  });
});

//insert new vote into the database
router.post("/vote", async (req, res) => {
  const { upvoted, EditId, upi } = req.body;

  await postVotes(upvoted, EditId, upi).then((result) => {
    if (typeof result == String) {
      return res.send(result);
    } else {
      return res.json(result);
    }
  });
});

//insert new report into the database
router.post("/report", async (req, res) => {
  const { reported, EditId, UserUpi } = req.body;

  await postReports(reported, EditId, UserUpi).then((result) => {
    return res.json(result);
  });
});

module.exports = router;
