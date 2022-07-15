const express = require("express");
const router = express.Router();
const adminApiRouter = require("./api-admin");
const moderationApiRouter = require("./api-moderation");

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
  userData,
  captionSentenceData,
  editData,
  reportData,
  voteData,
  createCaption,
} = require("../data.test/routerData.test");

// Import controller from endPoints
const {
  getCaptions,
  getEdits,
  getOwned,
  postEdits,
  postVotes,
  postReports,
  approvals,
  blocks,
  getReports,
  getUser,
  deleteSession,
} = require("../controller/endPoints");

// Middleware to ensure authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401);
  res.json({ status: "User not authenticated" });
}

// Test with id: 9592f9fc-0af4-49b8-9e38-ad6b004d17df
router.get("/captions/:lectureId/", isAuthenticated, async (req, res) => {
  let { lectureId } = req.params;

  await getCaptions(lectureId, req.user.upi, req, res).then((result) => {
    return res.json(result);
  });
});

//query the edits of one sentence
router.get("/edits/:sentenceId/", isAuthenticated, async (req, res) => {
  let { sentenceId } = req.params;

  await getEdits(sentenceId, req.user.upi).then((result) => {
    if (result == "Caption sentence not found") {
      return res.status(404).send(result);
    } else {
      return res.json(result);
    }
  });
});

// Not currently required
// router.get("/UnapprovedEdits/:lectureId", async (req, res) => {
//   let { lectureId } = req.params;

//   await getUnapprovedEdits(lectureId).then((result) => {
//     if (result == "caption file not found") {
//       return res.status(404).send(result);
//     } else {
//       return res.json(result);
//     }
//   });
// });

//insert new edits into the database
router.post("/edit", isAuthenticated, async (req, res) => {
  const { sentenceId, body } = req.body;

  await postEdits(sentenceId, body, req.user.upi).then((result) => {
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
router.post("/vote", isAuthenticated, async (req, res) => {
  const { upvoted, EditId } = req.body;

  await postVotes(upvoted, EditId, req.user.upi).then((result) => {
    if (typeof result == String) {
      return res.send(result);
    } else {
      return res.json(result);
    }
  });
});

router.get("/getOwned", async (req, res) => {
  await getOwned(req.user.upi).then((result) => {
    return res.json(result);
  });
});

router.post("/approvals", async (req, res) => {
  const { approved, id } = req.body;

  await approvals(approved, id, req.user.upi).then((result) => {
    if (typeof result == String) {
      return res.send(result);
    } else {
      return res.json(result);
    }
  });
});

router.post("/block", async (req, res) => {
  const { blocked, id } = req.body;
  await blocks(blocked, id, req.user.upi).then((result) => {
    if (typeof result == String) {
      return res.send(result);
    } else {
      return res.json(result);
    }
  });
});

//insert new report into the database
router.post("/report", isAuthenticated, async (req, res) => {
  const { reported, EditId } = req.body;

  await postReports(reported, EditId, req.user.upi).then((result) => {
    return res.json(result);
  });
});

//insert new report into the database
router.get("/getReport", isAuthenticated, async (req, res) => {
  await getReports(req.user.upi).then((result) => {
    return res.json(result);
  });
});

router.post("/deleteSession", isAuthenticated, async (req, res) => {
  const { id } = req.body;
  console.log(id);
  await deleteSession(id, req.user.upi).then((result) => {
    if (typeof result == String) {
      return res.send(result);
    } else {
      return res.json(result);
    }
  });
});

router.get("/status", isAuthenticated, async (req, res) => {
  return res.json(await getUser(req, res));
});

router.use("/admin", adminApiRouter);
router.use("/mod", moderationApiRouter);
module.exports = router;
