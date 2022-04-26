const { Op } = require("sequelize");
const qs = require("qs");
const axios = require("axios");
const { default: srtParser2 } = require("srt-parser-2");
import { QueryTypes } from "sequelize";

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

export const getCaptions = async (lectureId, upi, accessToken) => {
  try {
    const result = await CaptionFile.findOne({
      where: { lecture_id: lectureId },
    });
    if (!result) {
      // Confirm user is able to view this lecture. Break if not. Fetch folder
      const lectureInfo = await axios.get(
        `https://${process.env.panopto_host}/Panopto/api/v1/sessions/${lectureId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (
        lectureInfo.status != "200" ||
        !lectureInfo.data ||
        !lectureInfo.data.Urls ||
        !lectureInfo.data.Urls.CaptionDownloadUrl
      ) {
        console.log("Warning! Captions not found");
        return { error: "Captions not found" };
      }
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
        return { error: "Video has no CrowdCaptions owner" };
      }
      // console.log(lectureInfo);
      // Get cookies for requesting captions
      // NB - ZAC 19th Jan 2022: At this stage requesting captions requires the user to call "Panopto/api/v1/auth/legacyLogin" to get some cookies to simulate using the site as a regular user. This does that.
      const authData = await axios.get(
        `https://${process.env.panopto_host}/Panopto/api/v1/auth/legacyLogin`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
              Authorization: `Bearer ${accessToken}`,
              cookie: `${aspxAuthCookie} ${csrfCookie}`,
            },
          }
        );
        jsonSrt = await parser.fromSrt(captionResponse.data);
      }

      // Check if the file exsits
      if (jsonSrt && jsonSrt != []) {
        // First save lecture information in captionFiles table
        await CaptionFile.create({
          lecture_id: lectureId,
          lecture_folder: lectureInfo.data.FolderDetails.Id,
          lecture_name: lectureInfo.data.Name,
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
    }

    const caption = await CaptionSentence.findAll({
      where: {
        CaptionFileLectureId: { [Op.eq]: lectureId },
      },
    });

    return {
      Caption_file: await Promise.all(
        // Return each caption sentence and get its best edit
        caption.map(async (item) => {
          let editData = await getEdits(item.id, upi);
          let bestEdit = null;

          if (editData) {
            bestEdit = editData.sort((a, b) => (a.votes < b.votes ? 1 : -1))[0];
          }

          if (bestEdit == null) {
            bestEdit = {};
          }

          return {
            id: item.id,
            start: item.start,
            body: item.body,
            bestEdit: bestEdit,
          };
        })
      ),
    };
  } catch (err) {
    console.log(err);
  }
};

export const getEdits = async (sentenceId, upi) => {
  try {
    //fetch the parent caption sentence
    const parentCapiton = await CaptionSentence.findAll({
      where: {
        id: sentenceId,
      },
    });
    //check if the parent sentence exist
    if (!!parentCapiton.length) {
      return await Edit.findAll({
        where: {
          CaptionSentenceId: sentenceId,
          blocked: false,
        },
        include: [
          {
            model: Report,
          },
          {
            model: Vote,
          },
        ],
      }).then(async (result) => {
        let toRet = [];

        for (let x = 0; x < result.length; x++) {
          // Determine report status
          const hasUserReported = await result[x].Reports.some(
            (e) => e.UserUpi == upi
          );

          //find votes for all the edits
          const userVote = result[x].Votes.find((v) => v.UserUpi);
          const hasUserUpVoted = userVote ? userVote.upvoted : null;

          const upVotes = await result[x].Votes.filter((i) => i.upvoted).length;
          const downVotes = await result[x].Votes.filter((i) => !i.upvoted)
            .length;

          //return the result to the front end
          toRet.push({
            id: result[x].id,
            body: result[x].body,
            approved: result[x].approved,
            blocked: result[x].blocked,
            createdAt: result[x].createdAt,
            updatedAt: result[x].updatedAt,
            CaptionSentenceId: result[x].CaptionSentenceId,
            UserId: result[x].UserId,
            upvoted: hasUserUpVoted,
            reported: hasUserReported,
            upVotes: upVotes,
            downVotes: downVotes,
            votes: upVotes - downVotes,
          });
        }
        return toRet;
      });
    } else {
      //return error message if code does not run as intended
      return "Caption sentence not found";
    }
  } catch (err) {
    console.log(err);
  }
};

export const getUnapprovedEdits = async (lectureId) => {
  try {
    const result = await CaptionFile.findOne({
      where: { lecture_id: lectureId },
    });
    if (result) {
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
    });
    return data;
  } catch (err) {
    console.log(err);
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
        return "vote removed";
        //else we update the current vote
      } else {
        const change = await Vote.update(update, {
          where: {
            EditId,
            UserUpi: upi,
          },
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
    return {
      message: "vote created",
      data,
    };
  } catch (err) {
    return "Upi is too long or Edit does not exist";
  }
};

export const postReports = async (reported, EditId, UserUpi) => {
  try {
    const result = await Report.findOne({ where: { UserUpi, EditId } });
    //if the vote exist and have the same value, we assume the user wish to undo the report
    if (result) {
      await Report.destroy({
        where: {
          UserUpi,
          EditId,
        },
      });
      return {
        message: "report removed",
        result,
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
      return {
        message: "created new report",
        data,
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
      return [];
    }
    const ownedCourses = await CaptionFile.findAll({
      where: {
        lecture_folder: {
          [Op.in]: ownedFolders,
        },
      },
    });
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
    return await Report.findAll({
      // Show all course reports if superuser
      where:
        user.access === 2
          ? undefined
          : {
              "Edit.CaptionSentence.CaptionFile.lecture_folder": {
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
              },
            },
            { model: User },
            {
              model: Vote,
              attributes: [
                "upvoted",

                [sequelize.fn("count", sequelize.col("*")), "votes"],
              ],
            },
          ],
        },
        { model: User, attributes: ["username", "email", "name"] },
      ],
      attributes: ["id", "createdAt"],
      group: [
        "Report.id",
        "Edit.id",
        "Edit.body",
        "Edit.approved",
        "Edit.blocked",
        "Edit.CaptionSentence.id",
        "Edit.CaptionSentence.CaptionFile.lecture_id",
        "Edit.CaptionSentence.CaptionFile.lecture_name",
        "Edit.User.access",
        "Edit.User.email",
        "Edit.User.upi",
        "Edit.Votes.id",
        "User.upi",
        "Edit.Votes.upvoted",
      ],
    });
  } catch (err) {
    console.log(err);
  }
};
