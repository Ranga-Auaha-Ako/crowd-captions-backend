const express = require("express");
const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const router = express.Router();

// Initialise Winston for logging
const auditLogger = require("../utilities/log");

// Import models as database relations
const {
  User,
  courseOwnerships,
  Edit,
  CaptionSentence,
  CaptionFile,
} = require("../models");

// Middleware to ensure authentication
async function isModerator(req, res, next) {
  if (!req.isAuthenticated()) {
    res.status(401);
    res.json({ status: "User not authenticated" });
    return;
  }
  const user = await User.findOne({
    where: { upi: req.user.upi },
  });
  if (user.access > 0) {
    return next();
  }
  res.status(401);
  res.json({ status: "User not a moderator" });
  return;
}

// Fetch recent edits, with lots of metadata attached.
router.get("/recent/:page?/", isModerator, async (req, res) => {
  let { page } = req.params;
  const { query } = req.query;
  const user = await User.findOne({
    where: { upi: req.user.upi },
    include: {
      model: courseOwnerships,
    },
  });
  const userOwnerships = user.courseOwnerships.map(
    (ownership) => ownership.lecture_folder
  );
  if (query && query.length > 50) {
    return res.status(400).json({ status: "error", message: "Query too long" });
  }
  if (!page) page = 1;
  try {
    const { rows: data, count } = await Edit.findAndCountAll({
      where: query
        ? {
            [Op.or]: {
              body: { [Op.iLike]: `%${query}%` },
              "$User.name$": { [Op.iLike]: `%${query}%` },
              "$User.username$": { [Op.iLike]: `%${query}%` },
              "$CaptionSentence.body$": { [Op.iLike]: `%${query}%` },
              "$CaptionSentence.CaptionFile.lecture_folder$": {
                [Op.iLike]: `%${query}%`,
              },
              "$CaptionSentence.CaptionFile.lecture_name$": {
                [Op.iLike]: `%${query}%`,
              },
            },
            "$CaptionSentence.CaptionFile.lecture_folder$": {
              [Op.in]: userOwnerships,
            },
          }
        : {
            "$CaptionSentence.CaptionFile.lecture_folder$": {
              [Op.in]: userOwnerships,
            },
          },
      include: [
        {
          model: User,
          attributes: ["name", "username"],
          required: true,
        },
        {
          model: CaptionSentence,
          attributes: ["body", "start"],
          include: {
            model: CaptionFile,
            attributes: ["lecture_name", "lecture_id", "lecture_folder"],
            required: true,
          },
          required: true,
        },
      ],
      attributes: ["body", "approved", "blocked", "createdAt", "id"],
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
    });
    res.json({ data, count });
  } catch (err) {
    res.status(500);
    console.log(err);
    res.json({ status: "error" });
  }
});

module.exports = router;
