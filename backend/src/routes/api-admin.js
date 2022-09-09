const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();

// Initialise Winston for logging
const auditLogger = require("../utilities/log");

// Import models as database relations
const {
  sequelize,
  User,
  courseOwnerships,
  CaptionFile,
  Edit,
  CaptionSentence,
} = require("../models");

// Middleware to ensure authentication
async function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    res.status(401);
    res.json({ status: "User not authenticated" });
    return;
  }
  const user = await User.findOne({
    where: { upi: req.user.upi },
    // include: {
    //   model: courseOwnerships,
    // },
  });
  if (user.access !== 2) {
    res.status(401);
    res.json({ status: "User not admin" });
    return;
  }
  return next();
}

router.get("/users/:page?/", isAdmin, async (req, res) => {
  let { page } = req.params;
  if (!page) page = 1;
  try {
    const count = await User.count();
    const data = await User.findAll({
      attributes: [
        "upi",
        "name",
        "username",
        "access",
        [
          // Note the wrapping parentheses in the call below!
          sequelize.literal(`(SELECT COUNT(*)
          FROM "Edits"  AS Edit
          WHERE "User".upi = Edit."UserUpi"
            AND Edit.blocked = false)`),
          "EditCount",
        ],
      ],
      order: [
        ["access", "DESC"],
        [sequelize.col("EditCount"), "DESC"],
      ],
      limit: 10,
      offset: (page - 1) * 10,
    });
    res.json({ data, count });
  } catch (error) {
    console.log(error);
    res.status(500);
    res.json({ status: "error" });
  }
});

router.delete("/users/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({
      where: { upi: id },
    });
    if (!user) {
      res.status(404);
      res.json({ status: "User not found" });
      return;
    }
    await user.destroy();
    res.json({ status: "User deleted" });
    auditLogger.info({
      action: "deleteUser",
      user: req.user.upi,
      data: {
        upi: id,
      },
      result: "User deleted",
    });
  } catch (error) {
    res.status(500);
    res.json({ status: "error" });
  }
});

router.post("/user/:id/access", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { access } = req.body;
  if (access === undefined || ![0, 1, 2, -1].includes(access)) {
    res.status(400);
    res.json({ status: "Bad request" });
    return;
  }
  try {
    const user = await User.findOne({
      where: { upi: id },
    });
    if (!user) {
      res.status(404);
      res.json({ status: "User not found" });
      return;
    }
    user.access = access;
    await user.save();
    res.json({ status: "User updated" });
    auditLogger.info({
      action: "setUserAccess",
      user: req.user.upi,
      data: {
        upi: id,
        access: access,
      },
      result: "User Access Level Updated",
    });
  } catch (error) {
    res.status(500);
    res.json({ status: "error" });
  }
});

router.get("/users/search/:page?/", isAdmin, async (req, res) => {
  let { page } = req.params;
  const { query } = req.query;
  if (!query) {
    return res
      .status(400)
      .json({ status: "error", message: "No query provided" });
  }
  if (query.length > 50) {
    return res.status(400).json({ status: "error", message: "Query too long" });
  }
  if (!page) page = 1;
  try {
    const { rows: data, count } = await User.findAndCountAll({
      where: {
        [Op.or]: {
          username: { [Op.iLike]: `%${query}%` },
          name: { [Op.iLike]: `%${query}%` },
        },
      },
      attributes: ["upi", "name", "username", "access"],
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
    });
    res.json({ data, count });
  } catch (error) {
    res.status(500);
    res.json({ status: "error" });
  }
});

router.get("/ownerships/:page?/", isAdmin, async (req, res) => {
  let { page } = req.params;
  if (!page) page = 1;
  try {
    const count = await courseOwnerships.count();
    const data = await courseOwnerships.findAll({
      attributes: ["UserUpi", "lecture_folder", "folder_name", "id"],
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
      include: {
        model: User,
        attributes: ["upi", "name", "username", "access"],
      },
    });
    res.json({ data, count });
  } catch (error) {
    res.status(500);
    res.json({ status: "error" });
  }
});

router.get("/ownerships/search/:page?/", isAdmin, async (req, res) => {
  let { page } = req.params;
  const { query } = req.query;
  if (!query) {
    return res
      .status(400)
      .json({ status: "error", message: "No query provided" });
  }
  if (query.length > 50) {
    return res.status(400).json({ status: "error", message: "Query too long" });
  }
  if (!page) page = 1;
  try {
    const count = await courseOwnerships.count();
    const data = await courseOwnerships.findAll({
      where: {
        [Op.or]: {
          UserUpi: { [Op.iLike]: `%${query}%` },
          lecture_folder: { [Op.iLike]: `%${query}%` },
          folder_name: { [Op.iLike]: `%${query}%` },
          "$User.name$": { [Op.iLike]: `%${query}%` },
          "$User.username$": { [Op.iLike]: `%${query}%` },
        },
      },
      attributes: ["UserUpi", "lecture_folder", "folder_name", "id"],
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
      include: {
        model: User,
        attributes: ["upi", "name", "username", "access"],
      },
    });
    res.json({ data, count });
  } catch (error) {
    res.status(500);
    res.json({ status: "error" });
  }
});

router.post("/ownerships/:id?/", isAdmin, async (req, res) => {
  const { user, lecture_folder, folder_name } = req.body;
  const { id } = req.params;
  try {
    if (id) {
      const ownership = await courseOwnerships.findOne({ where: { id } });
      ownership.UserUpi = user;
      ownership.lecture_folder = lecture_folder;
      ownership.folder_name = folder_name;
      await ownership.save();
      auditLogger.info({
        action: "updateOwnership",
        user: req.user.upi,
        data: {
          id,
          upi: user,
          lecture_folder,
          folder_name,
        },
        result: "Ownership Updated",
      });
    } else {
      const data = await courseOwnerships.create({
        UserUpi: user,
        lecture_folder,
        folder_name,
      });
      auditLogger.info({
        action: "createOwnership",
        user: req.user.upi,
        data: {
          upi: user,
          lecture_folder,
          folder_name,
        },
        result: "Ownership Created",
      });
    }
    res.json({ status: "success" });
  } catch (error) {
    res.status(500);
    res.json({ status: "error" });
  }
});

router.delete("/ownerships/:id", isAdmin, async (req, res) => {
  let { id } = req.params;
  try {
    const ownership = await courseOwnerships.findOne({ where: { id } });
    if (!ownership) throw new Error("Ownership not found");
    await ownership.destroy();
    res.status(204);
    res.json({ status: "success" });
    auditLogger.info({
      action: "deleteOwnership",
      user: req.user.upi,
      data: { id },
      result: "Ownership Deleted",
    });
  } catch (err) {
    res.status(500);
    res.json({ status: "error" });
    auditLogger.info({
      action: "deleteOwnership",
      user: req.user.upi,
      data: { id },
      error: err,
      result: "Ownership Not Deleted",
    });
  }
});

router.get("/folders/search/:page?/", isAdmin, async (req, res) => {
  let { page } = req.params;
  const { query } = req.query;
  if (!query) {
    return res
      .status(400)
      .json({ status: "error", message: "No query provided" });
  }
  if (query.length > 50) {
    return res.status(400).json({ status: "error", message: "Query too long" });
  }
  if (!page) page = 1;
  try {
    const { rows, count } = await CaptionFile.findAndCountAll({
      where: {
        lecture_folder: { [Op.iLike]: `%${query}%` },
        lecture_folder: { [Op.iLike]: `%${query}%` },
      },
      attributes: [
        [
          sequelize.fn("DISTINCT", sequelize.col("lecture_folder")),
          "lecture_folder",
        ],
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
    });
    const data = await Promise.all(
      rows.map(async (row) => {
        const existingOwnership = await courseOwnerships.findOne({
          where: { lecture_folder: row.lecture_folder },
        });
        return {
          lecture_folder: row.lecture_folder,
          folder_name: existingOwnership ? existingOwnership.folder_name : "",
        };
      })
    );
    res.json({ data: data, count: count });
  } catch (error) {
    res.status(500);
    console.log(error);
    res.json({ status: "error" });
  }
});

router.get("/videos/:page?/", isAdmin, async (req, res) => {
  let { page } = req.params;
  const { query } = req.query;
  if (query && query.length > 50) {
    return res.status(400).json({ status: "error", message: "Query too long" });
  }
  if (!page) page = 1;
  try {
    const { rows: data, count } = await CaptionFile.findAndCountAll({
      where: query
        ? {
            [Op.or]: {
              lecture_name: { [Op.iLike]: `%${query}%` },
              lecture_id: { [Op.iLike]: `%${query}%` },
              lecture_folder: { [Op.iLike]: `%${query}%` },
            },
          }
        : {},
      attributes: ["lecture_name", "lecture_id", "lecture_folder", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 10,
      offset: (page - 1) * 10,
    });
    res.json({ data, count });
  } catch (error) {
    res.status(500);
    res.json({ status: "error" });
  }
});

router.delete("/videos/:id", isAdmin, async (req, res) => {
  let { id } = req.params;
  if (!id) {
    return res.json({
      status: "error",
      message: "ID to delete must be provided",
    });
  }
  try {
    const video = await CaptionFile.findOne({ where: { lecture_id: id } });
    if (!video) throw new Error("Video not found");
    await video.destroy();
    res.status(204);
    res.json({ status: "success" });
    auditLogger.info({
      action: "deleteVideo",
      user: req.user.upi,
      data: { id },
      result: "Video Deleted",
    });
  } catch (error) {
    res.status(500);
    res.json({ status: "error" });
    auditLogger.info({
      action: "deleteVideo",
      user: req.user.upi,
      data: { id },
      error: err,
      result: "Video Not Deleted",
    });
  }
});

// Fetch recent edits, with lots of metadata attached.
router.get("/recent/:page?/", isAdmin, async (req, res) => {
  let { page } = req.params;
  const { query } = req.query;
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
          }
        : {},
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
