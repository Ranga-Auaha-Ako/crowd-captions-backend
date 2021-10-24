// Import modules
const express = require("express");
const router = express.Router();

// Import models
const {
  sequelize,
  CaptionFile,
  CaptionSentence,
  Edit,
  Report,
  User,
  Vote,
} = require("../models");

// Import mock data functions
const {
  captionFileData,
  captionSentenceData,
  editData,
  reportData,
  userData,
  voteData,
  createCaption,
} = require("../data.test/routerData.test");

// Import controller
const {
  getCaptions,
  getEdits,
  postEdits,
  postVotes,
  postReports
} = require("../controller/endPoints")

router.get("/", async (req, res) => {
  await sequelize.sync({ force: true });

  // Add mock data
  await captionFileData(CaptionFile);
  await captionSentenceData(CaptionSentence);
  await userData(User);
  await editData(Edit);
  await reportData(Report);
  await voteData(Vote);

  res.send(`received on port: ${process.env.PORT}`);
});

// Test with id: 9592f9fc-0af4-49b8-9e38-ad6b004d17df
router.get("/captions/:lectureId/:upi", async (req, res) => {
  let {lectureId, upi} = req.params;

  await getCaptions(lectureId, upi, res)
});

//query the edits of one sentence
router.get("/edits/:sentenceId/:upi", async (req, res) => {
  let {sentenceId, upi} = req.params

  await getEdits(sentenceId, upi, res);
});

//insert new edits into the database
router.post("/edit", async (req, res) => {
  const { sentenceId, body, upi } = req.body;

  await postEdits(sentenceId, body, upi, res);
});

//insert new vote into the database
router.post("/vote", async (req, res) => {
  const { upvoted, EditId, upi } = req.body;
  
  await postVotes(upvoted, EditId, upi, res);
});

//insert new report into the database
router.post("/report", async (req, res) => {
  const { report, EditId, UserUpi } = req.body;
  
  await postReports(report, EditId, UserUpi, res);
});

module.exports = router;
