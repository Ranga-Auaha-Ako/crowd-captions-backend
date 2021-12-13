const { Op } = require("sequelize");
const qs = require("qs");
const axios = require("axios");
const { default: srtParser2 } = require("srt-parser-2");

// Import helper
const { getTimeFromStart } = require("../helper/getTimeFromStart");

//import all database as constants
const {
  sequelize,
  CaptionFile,
  CaptionSentence,
  Edit,
  Report,
  User,
  Vote,
} = require("../models");

export const getCaptions = async (lectureId, upi, accessToken) => {
  try {
    const result = await CaptionFile.findOne({
      where: { lecture_id: lectureId },
    });
    console.log(result);
    if (!result) {
      // Confirm user is able to view this lecture. Break if not
      const lectureInfo = await axios.get(
        `https://aucklandtest.au.panopto.com/Panopto/api/v1/sessions/${lectureId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (
        lectureInfo.status != "200" ||
        !lectureInfo.data ||
        !lectureInfo.data?.Urls?.CaptionDownloadUrl
      ) {
        return [];
      }

      let parser = new srtParser2();

      let getSrtConfig = {
        method: "get",
        url: lectureInfo.data?.Urls?.CaptionDownloadUrl,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };

      await axios(getSrtConfig).then(async (response) => {
        let jsonSrt = await parser.fromSrt(response.data);

        // Check if the file exsits
        if (jsonSrt) {
          // First save lecture information in captionFiles table
          const lectureData = CaptionFile.build({
            lecture_id: lectureId,
          });

          await lectureData.save();

          // Then save lecture captions information in captionSentences table
          await jsonSrt.forEach(async (sentence) => {
            const sentenceData = CaptionSentence.build({
              position: sentence.id,
              start: getTimeFromStart(sentence.startTime),
              body: sentence.text,
              CaptionFileLectureId: lectureId,
            });

            await sentenceData.save();
          });
        }
      });
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
          reports: { [Op.lte]: 3 },
        },
      }).then(async (result) => {
        let toRet = [];

        //find votes for all the edits
        for (let x = 0; x < result.length; x++) {
          const votes = await Vote.findAll({
            where: {
              EditId: { [Op.eq]: result[x].id },
            },
          });
          let hasUserUpVoted = null;

          for (let i = 0; i < votes.length; i++) {
            if (upi == votes[i]["dataValues"]["UserUpi"]) {
              hasUserUpVoted = votes[i]["dataValues"]["upvoted"];
            }
            //console.log(votes[i] ) //["dataValues"]["upvoted"]
          }

          const upVotes = await votes.filter((x) => x.upvoted).length;
          const downVotes = await votes.filter((x) => !x.upvoted).length;

          //return the result to the front end
          toRet.push({
            id: result[x].id,
            body: result[x].body,
            reports: result[x].reports,
            createdAt: result[x].createdAt,
            updatedAt: result[x].updatedAt,
            CaptionSentenceId: result[x].CaptionSentenceId,
            UserId: result[x].UserId,
            upvoted: hasUserUpVoted,
            reported: null,
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
      reports: 0,
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
      console.log(result);
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
      await data.save();
      return {
        message: "created new report",
        data,
      };
    }
  } catch (err) {
    console.log(err);
  }
};
