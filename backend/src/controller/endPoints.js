const { Op } = require("sequelize");
const qs = require("qs");
const axios = require("axios");
const { default: srtParser2 } = require("srt-parser-2");
const refresh = require("passport-oauth2-refresh");
const { promisify } = require("util");
import { QueryTypes } from "sequelize";
const jwt = require("jsonwebtoken");
const setToken = require("../utilities/setToken");

// Require Winston for logging
const auditLogger = require("../utilities/log");

// Import helper
const { getTimeFromStart } = require("../helper/getTimeFromStart.js");

//import all database as constants
const {
  sequelize,
  CaptionFile,
  CaptionSentence,
  Edit,
  Report,
  User,
  Vote,
  courseOwnerships,
} = require("../models");

export const getUser = async (req, res) => {
  // First see if we need to refresh the token
  const tokenData = jwt.decode(req.user.accessToken);
  let additionalResData = {};
  if (req.user.refreshToken && tokenData && tokenData.exp < Date.now() / 1000) {
    // We need to refresh the Panopto token!
    try {
      // Don't check while wrongly configured extension is in production
      // if (!req.query.supportRefresh === "true") {
      //   throw new Error("Refresh token not supported");
      // }
      const [newAccessToken, newRefreshToken] = await promisify(
        (strategy, token, cb) =>
          refresh.requestNewAccessToken(strategy, token, (err, ...results) =>
            cb(err, results)
          )
      )("oauth2", req.user.refreshToken);
      // We have a new access token!
      // Update user access token
      const newUser = {
        ...req.user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
      const newJWT = setToken(newUser, res);
      auditLogger.info({
        action: "getUser",
        user: newUser.upi,
        result: "User refreshed token",
      });
      additionalResData = {
        updated: true,
        newJWT,
      };
    } catch (err) {
      console.error(err);
      res.status(401);
      return {
        error: "Token refresh failed",
        app_version: process.env.CROWD_CAPTIONS_VERSION,
      };
    }
  } else {
    auditLogger.info({ action: "getUser", user: req.user.upi });
    // Get user stats
    const editsCount = await Edit.count({
      where: { UserUpi: req.user.upi, blocked: false },
    });
    return {
      ...req.user,
      ...additionalResData,
      stats: {
        edits: editsCount,
      },
      app_version: process.env.CROWD_CAPTIONS_VERSION,
    };
  }
};

export const getCaptions = async (
  lectureId,
  upi,
  { user, logIn },
  res,
  retry = false
) => {
  try {
    // Confirm user is able to view this lecture. Break if not. Fetch folder
    const lectureInfo = await axios
      .get(
        `https://${process.env.panopto_host}/Panopto/api/v1/sessions/${lectureId}`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
          validateStatus(status) {
            return status < 500; // Resolve only if the status code is less than 500
          },
        }
      )
      .catch((error) => {
        console.log(
          `Error (${error.response.status}) fetching lecture ${lectureId} info: ${error.response.data}`
        );
      });
    if (
      lectureInfo.status != 200 ||
      !lectureInfo.data ||
      !lectureInfo.data.Urls ||
      !lectureInfo.data.Urls.CaptionDownloadUrl
    ) {
      console.log(
        `User failed to load captions on video ${lectureId}. Response: ${
          lectureInfo.status
        } | URL: ${
          lectureInfo.data && lectureInfo.data.Urls
            ? lectureInfo.data.Urls.CaptionDownloadUrl
            : lectureInfo.data
        }`
      );
      // Log to the audit trail the results of this query
      auditLogger.info({
        action: "getCaptions",
        user: upi,
        lectureId,
        result: "No Captions URL",
      });
      return {
        error:
          "Captions not found. This may be because there are no captions or the video was uploaded through Zoom.",
      };
    }
    let result = await CaptionFile.findOne({
      where: { lecture_id: lectureId },
    });
    if (!result) {
      console.log(
        `New caption data URL found: ${lectureInfo.data.Urls.CaptionDownloadUrl} in folder ${lectureInfo.data.FolderDetails.Id}`
      );
      // Check to see if someone owns the folder, otherwise discard video
      const courseOwnership = await courseOwnerships.findOne({
        where: {
          lecture_folder: lectureInfo.data.FolderDetails.Id,
        },
      });
      if (!courseOwnership) {
        auditLogger.info({
          action: "getCaptions",
          user: upi,
          lectureId,
          result: "No Onwer",
        });
        return { error: "Video has no CrowdCaptions owner" };
      }
      // console.log(lectureInfo);
      // Get cookies for requesting captions
      // NB - ZAC 19th Jan 2022: At this stage requesting captions requires the user to call "Panopto/api/v1/auth/legacyLogin" to get some cookies to simulate using the site as a regular user. This does that.
      const authData = await axios.get(
        `https://${process.env.panopto_host}/Panopto/api/v1/auth/legacyLogin`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );
      const [aspxAuthCookie, csrfCookie] = authData.headers["set-cookie"];

      let parser = new srtParser2();

      let jsonSrt = [];
      let lang = -2;
      // Loop over  a few language options to try and capture the "correct" language
      while ((!jsonSrt || !jsonSrt.length) && lang < 2) {
        lang++;
        const langString = lang !== -2 ? "" : `&language=${lang}`;
        const captionResponse = await axios.get(
          `${lectureInfo.data.Urls.CaptionDownloadUrl}${langString}`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              cookie: `${aspxAuthCookie} ${csrfCookie}`,
            },
          }
        );
        jsonSrt = await parser.fromSrt(captionResponse.data);
      }

      // Check if the file exsits
      if (jsonSrt && jsonSrt != []) {
        // First save lecture information in captionFiles table
        result = await CaptionFile.create({
          lecture_id: lectureId,
          lecture_folder: lectureInfo.data.FolderDetails.Id,
          lecture_name: lectureInfo.data.Name,
          duration: Math.floor(lectureInfo.data.Duration),
        });
        // Then save lecture captions information in captionSentences table
        for await (const sentence of jsonSrt) {
          await CaptionSentence.create({
            position: sentence.id,
            start: getTimeFromStart(sentence.startTime),
            body: sentence.text,
            CaptionFileLectureId: lectureId,
          });
        }
      }
    } else {
      // Check to see if we need to delete the captions and regenerate
      if (
        result.duration &&
        Math.floor(lectureInfo.data.Duration) !== result.duration &&
        !retry
      ) {
        // Check to see if we have any edits
        const captions = await CaptionSentence.findAll({
          where: {
            CaptionFileLectureId: { [Op.eq]: lectureId },
          },
          attributes: {
            include: [
              [
                // Note the wrapping parentheses in the call below!
                sequelize.literal(`(SELECT COUNT(*)
                FROM "Edits"  AS Edit
                WHERE "CaptionSentence".id = Edit."CaptionSentenceId"
                  AND Edit.blocked = false)`),
                "EditCount",
              ],
            ],
          },
        });
        if (captions.find((c) => captions[0].dataValues["EditCount"] > 0)) {
          // We have edits, so we can't delete the captions
          console.log(
            `Captions for ${lectureId} have edits, so we can't delete them, but a mismatch was found. Duration: ${
              result.duration
            } | Panopto: ${Math.floor(lectureInfo.data.Duration)}`
          );
        } else {
          console.log(`Deleting captions for ${lectureId} and regenerating`);
          result.destroy();
          auditLogger.info({
            action: "autoDeleteSession",
            lectureId,
            result: "success",
          });
          return await getCaptions(lectureId, upi, { user, logIn }, res, true);
        }
      }
    }

    const caption = await CaptionSentence.findAll({
      where: {
        CaptionFileLectureId: { [Op.eq]: lectureId },
      },
      attributes: ["id", "body", "start"],
      include: {
        model: Edit,
        where: { blocked: false },
        attributes: ["body", "id"],
        include: [
          {
            model: Vote,
            attributes: ["upvoted"],
          },
        ],
        separate: true,
      },
      order: [["start", "ASC"]],
    });
    const captions = caption.map((sentence) => {
      const bestEdit = sentence.Edits.length
        ? sentence.Edits.reduce((max, edit) => {
            //find votes for all the edits
            const upVotes = edit.Votes.filter((i) => i.upvoted).length;
            const downVotes = edit.Votes.filter((i) => !i.upvoted).length;
            const voteScore = upVotes - downVotes;

            return max.voteScore > voteScore
              ? max
              : { ...edit.dataValues, voteScore, upVotes, downVotes };
          }, {})
        : {};
      return {
        id: sentence.id,
        start: sentence.start,
        body: sentence.body,
        bestEdit: {
          id: bestEdit.id,
          body: bestEdit.body,
          upVotes: bestEdit.upVotes,
          downVotes: bestEdit.downVotes,
          votes: bestEdit.voteScore,
        },
      };
    });
    auditLogger.info({
      action: "getCaptions",
      user: upi,
      lectureId,
      result: "Success",
    });
    return {
      Caption_file: captions,
      meta: {
        Lecture_id: result.lecture_id,
        Video_name: result.lecture_name,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

export const getEdits = async (sentenceId, upi) => {
  try {
    //fetch the parent caption sentence
    const parentCaption = await CaptionSentence.findOne({
      where: {
        id: sentenceId,
      },
      include: [
        {
          model: Edit,
          include: [
            {
              model: Report,
              where: {
                UserUpi: upi,
              },
              separate: true,
            },
            {
              model: Vote,
              attributes: ["upvoted", "UserUpi"],
            },
          ],
          where: {
            blocked: false,
          },
          separate: true,
        },
      ],
    });
    //check if the parent sentence exist
    if (parentCaption) {
      auditLogger.info({
        action: "getEdits",
        user: upi,
        sentenceId,
        result: "Success",
      });
      return parentCaption.Edits.map((edit) => {
        // Determine report status
        const hasUserReported = edit.Reports.length;

        //find votes for all the edits
        const userVote = edit.Votes.find((v) => v.UserUpi === upi);
        const hasUserUpVoted = userVote ? userVote.upvoted : null;

        const upVotes = edit.Votes.filter((i) => i.upvoted).length;
        const downVotes = edit.Votes.filter((i) => !i.upvoted).length;

        //return the result to the front end
        return {
          id: edit.id,
          body: edit.body,
          CaptionSentenceId: edit.CaptionSentenceId,
          upvoted: hasUserUpVoted,
          reported: hasUserReported,
          upVotes: upVotes,
          downVotes: downVotes,
          votes: upVotes - downVotes,
          isAuthor: edit.UserUpi === upi, // Whether the current user is the author of this suggestion
        };
      });
    } else {
      //return error message if code does not run as intended
      auditLogger.info({
        action: "getEdits",
        user: upi,
        sentenceId,
        result: "NotFound",
      });
      return "Caption sentence not found";
    }
  } catch (err) {
    console.log(err);
  }
};

export const getUnapprovedEdits = async (lectureId, upi) => {
  try {
    const result = await CaptionFile.findOne({
      where: { lecture_id: lectureId },
    });
    if (result) {
      auditLogger.info({
        action: "getUnapprovedEdits",
        user: upi,
        lectureId,
        result: "Success",
      });
      return await CaptionSentence.findAll({
        where: { CaptionFileLectureId: lectureId },
      }).then(async (sentences) => {
        let toRet = [];

        for (let x = 0; x < sentences.length; x++) {
          const edits = await Edit.findAll({
            where: {
              CaptionSentenceId: { [Op.eq]: sentences[x].id },
              approved: false,
            },
          });
          toRet.push(edits);
        }
        return toRet;
      });
    } else {
      auditLogger.info({
        action: "getUnapprovedEdits",
        user: upi,
        lectureId,
        result: "NotFound",
      });
      return "caption file not found";
    }
  } catch (err) {
    console.log(err);
  }
};

export const postEdits = async (sentenceId, body, upi) => {
  try {
    // check if body is too long
    if (body.length > 200) {
      return "Edit should be less than 200 chracters";
    }
    //check if user exist
    let checkUser = await User.findOne({ where: { upi: upi } });
    //create user if user not exist
    if (checkUser == null) {
      checkUser = await User.create({ upi });
    }
    //insert edit
    const data = await Edit.build({
      body,
      approved: false,
      blocked: false,
      CaptionSentenceId: sentenceId,
      UserUpi: upi,
    });
    await data.save().then((d) => {
      Vote.create({
        upvoted: true,
        EditId: d["dataValues"]["id"],
        UserUpi: upi,
      });
      auditLogger.info({
        action: "postEdits",
        user: upi,
        sentenceId,
        EditId: d["dataValues"]["id"],
        EditContents: body,
        result: "Success",
      });
    });
    return data;
  } catch (err) {
    console.log(err);
    auditLogger.info({
      action: "postEdits",
      user: upi,
      sentenceId,
      result: "NotFound",
    });
    return "Caption Sentence does not exist";
  }
};

export const postVotes = async (upvoted, EditId, upi) => {
  try {
    let update = { upvoted: upvoted };
    const result = await Vote.findOne({ where: { UserUpi: upi, EditId } });
    //if the vote exists in the db
    if (result) {
      //if the vote exist and have the same value, we can just remove it
      if (result["dataValues"]["upvoted"] == (upvoted === "true")) {
        Vote.destroy({ where: { EditId, UserUpi: upi } });
        auditLogger.info({
          action: "postVotes",
          user: upi,
          EditId,
          Vote: 0,
          result: "Removed",
        });
        return "vote removed";
        //else we update the current vote
      } else {
        const change = await Vote.update(update, {
          where: {
            EditId,
            UserUpi: upi,
          },
        });
        auditLogger.info({
          action: "postVotes",
          user: upi,
          EditId,
          Vote: upvoted ? 1 : -1,
          result: "Changed",
        });
        return {
          message: "vote changed",
          change,
        };
      }
    }
    let checkUser = await User.findOne({ where: { upi: upi } });
    //create user if user not exist
    if (checkUser == null) {
      checkUser = await User.create({ upi });
    }
    //if the vote does not exist we can create a new one
    const data = await Vote.create({
      upvoted,
      EditId,
      UserUpi: upi,
    });
    await data.save();
    auditLogger.info({
      action: "postVotes",
      user: upi,
      EditId,
      Vote: upvoted ? 1 : -1,
      result: "Created",
    });
    return {
      message: "vote created",
      data,
    };
  } catch (err) {
    auditLogger.info({
      action: "postVotes",
      user: upi,
      EditId,
      result: `Error: ${err}`,
    });
    return "Upi is too long or Edit does not exist";
  }
};

export const postReports = async (reported, EditId, UserUpi) => {
  try {
    // First, if the user is reporting their own edit, just block it
    const edit = await Edit.findOne({
      where: { id: EditId, UserUpi: UserUpi },
    });
    if (edit) {
      edit.blocked = true;
      await edit.save();
      auditLogger.info({
        action: "postReports",
        user: UserUpi,
        EditId,
        result: "Deleted",
      });
      return {
        message: "self-edit removed",
      };
    }

    const result = await Report.findOne({ where: { UserUpi, EditId } });
    //if the vote exist and have the same value, we assume the user wish to undo the report
    if (result) {
      await Report.destroy({
        where: {
          UserUpi,
          EditId,
        },
      });
      auditLogger.info({
        action: "postReports",
        user: UserUpi,
        EditId,
        result: "Removed",
      });
      return {
        message: "report removed",
      };
    }
    //create report if it does not exist
    else {
      const data = await Report.create({
        EditId,
        UserUpi,
      });
      // Reset Vote to a downvote if any
      const result = await Vote.findOne({ where: { UserUpi, EditId } });
      if (result && result.upvoted) {
        // Result was upvoted. Change to a downvote and save.
        result.upvoted = false;
        await result.save();
      } else if (!result) {
        await Vote.create({
          upvoted: false,
          EditId,
          UserUpi,
        });
      }
      auditLogger.info({
        action: "postReports",
        user: UserUpi,
        EditId,
        result: "Created",
      });
      return {
        message: "created new report",
      };
    }
  } catch (err) {
    console.log(err);
  }
};

export const approvals = async (approved, id, UserUpi) => {
  try {
    const result = await Edit.findOne({
      where: { id },
      include: [{ model: CaptionSentence, include: [{ model: CaptionFile }] }],
    });
    if (result) {
      // Check to see if user owns the folder, otherwise stop here
      const courseOwnership = await courseOwnerships.findOne({
        where: {
          lecture_folder: result.CaptionSentence.CaptionFile.lecture_folder,
          UserUpi,
        },
      });
      if (!courseOwnership) {
        auditLogger.info({
          action: "postApprovals",
          user: UserUpi,
          EditId: id,
          result: "NoPermissions",
        });
        return { error: "User does not own the folder" };
      }
      // Update edit to be approved/unapproved
      const change = await Edit.update(
        { approved: approved },
        {
          where: {
            id,
          },
        }
      );
      auditLogger.info({
        action: "postApprovals",
        user: UserUpi,
        EditId: id,
        result: "Success",
      });
      return {
        message: "edit approvment state changed",
        change,
      };
    }
  } catch (err) {
    console.log(err);
  }
};

export const blocks = async (blocked, id, UserUpi) => {
  try {
    const result = await Edit.findOne({
      where: { id },
      include: [{ model: CaptionSentence, include: [{ model: CaptionFile }] }],
    });
    if (result) {
      // Check to see if user owns the folder, otherwise stop here
      const courseOwnership = await courseOwnerships.findOne({
        where: {
          lecture_folder: result.CaptionSentence.CaptionFile.lecture_folder,
          UserUpi,
        },
      });
      if (!courseOwnership) {
        auditLogger.info({
          action: "postBlock",
          user: UserUpi,
          EditId: id,
          result: "NoPermissions",
        });
        return { error: "User does not own the folder" };
      }
      // Update edit to be blocked/unblocked
      const change = await Edit.update(
        { blocked: blocked },
        {
          where: {
            id,
          },
        }
      );
      auditLogger.info({
        action: "postBlock",
        user: UserUpi,
        EditId: id,
        result: "Success",
      });
      return {
        message: "edit block state changed",
        change,
      };
    }
  } catch (err) {
    console.log(err);
  }
};

export const getOwned = async (upi) => {
  try {
    const user = await User.findOne({
      where: { upi },
      include: {
        model: courseOwnerships,
      },
    });
    const ownedFolders = user.courseOwnerships.map(
      (course) => course.lecture_folder
    );
    if (!ownedFolders) {
      auditLogger.info({ action: "getOwned", user: upi, result: "NoneFound" });
      return [];
    }
    const ownedCourses = await CaptionFile.findAll({
      where: {
        lecture_folder: {
          [Op.in]: ownedFolders,
        },
      },
    });
    auditLogger.info({ action: "getOwned", user: upi, result: "Success" });
    return {
      folders: user.courseOwnerships.map((folder) => ({
        name: folder.folder_name,
        id: folder.lecture_folder,
      })),
      courses: ownedCourses,
    };
  } catch (err) {
    console.log(err);
  }
};

export const getReports = async (userId) => {
  try {
    const user = await User.findOne({
      where: { upi: userId },
      include: {
        model: courseOwnerships,
      },
    });
    const ownedFolders = user.courseOwnerships.map(
      (course) => course.lecture_folder
    );
    // Get reports, filtered by only the courses the user owns
    auditLogger.info({ action: "getReports", user: userId, result: "Success" });
    return await Report.findAll({
      // Show all course reports if superuser
      where:
        user.access === 2
          ? undefined
          : {
              "$Edit.CaptionSentence.CaptionFile.lecture_folder$": {
                [Op.in]: ownedFolders,
              },
            },
      include: [
        {
          model: Edit,
          attributes: ["body", "approved", "blocked", "id"],
          include: [
            {
              model: CaptionSentence,
              attributes: ["body", "start"],
              include: {
                model: CaptionFile,
                attributes: ["lecture_id", "lecture_name"],
                required: true,
              },
              required: true,
            },
            { model: User },
            {
              model: Vote,
              attributes: ["upvoted", "UserUpi"],
            },
          ],
        },
        { model: User, attributes: ["username", "email", "name"] },
      ],
      attributes: ["id", "createdAt"],
    });
  } catch (err) {
    auditLogger.info({ action: "getReports", user: upi, result: "Error" });
    console.log(err);
  }
};

export const deleteSession = async (lecture_id, userId) => {
  const user = await User.findOne({
    where: { upi: userId },
    include: {
      model: courseOwnerships,
    },
  });
  const session = await CaptionFile.findOne({
    where: {
      lecture_id,
    },
    include: [{ model: CaptionSentence }],
    attributes: ["lecture_folder"],
  });
  if (!session) return { error: "Session not found" };
  if (
    (user.access === 2) |
    user.courseOwnerships.find(
      (c) => c.lecture_folder === session.lecture_folder
    )
  ) {
    // If user is superuser or owns the session, delete the session
    debugger;
    await CaptionSentence.destroy({
      where: {
        id: { [Op.in]: session.CaptionSentences.map((s) => s.id) },
      },
    });
    await CaptionFile.destroy({
      where: {
        lecture_id,
      },
    });
    auditLogger.info({
      action: "deleteSession",
      user: userId,
      lecture_id,
      result: "Success",
    });
    return {
      message: "Session deleted",
    };
  } else {
    auditLogger.info({
      action: "deleteSession",
      user: userId,
      lecture_id,
      result: "NoPermissions",
    });
    return { error: "User does not own the session, or is not an admin" };
  }
};
