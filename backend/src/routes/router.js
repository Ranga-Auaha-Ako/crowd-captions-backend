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

  await getCaptions(lectureId, upi).then(result => {
    return res.json(result)
  })
});

//query the edits of one sentence
router.get("/edits/:sentenceId/:upi", async (req, res) => {
  let {sentenceId, upi} = req.params

  await getEdits(sentenceId, upi).then(result => {
    if (result == "Caption sentence not found") {
      return res.status(404).send(result)
    } else {
      console.log(result)
      return res.json(result)
    }
  });
});

//insert new edits into the database
router.post("/edit", async (req, res) => {
  const { sentenceId, body, upi } = req.body;

  await postEdits(sentenceId, body, upi).then(result => {
    if (result == "Caption Sentence does not exist") {
      return res.status(404).send(result)
    } 
    else if (result == "Edit should be less than 200 chracters") {
      return res.send(result)
    } 
    else {
      return res.json(result)
    }
  })
});

//insert new vote into the database
router.post("/vote", async (req, res) => {
  const { upvoted, EditId, upi } = req.body;
  
  await postVotes(upvoted, EditId, upi).then(result => {
    if (result == "vote removed") {
      return res.send(result)
    } 
    else {
      return res.json(result)
    }
  });
});

//insert new report into the database
router.post("/report", async (req, res) => {
  const { reported, EditId, UserUpi } = req.body;
  
  await postReports(reported, EditId, UserUpi).then(result => {
    return res.json(result)
  });
});

module.exports = router;
