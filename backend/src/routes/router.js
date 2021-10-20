// Import modules
const express = require("express");
const axios = require("axios");
const qs = require("qs");
const router = express.Router();
const { Op } = require("sequelize");
const { default: srtParser2 } = require("srt-parser-2");

// Import database
const db = require("../models");

// Import helper
const { getTimeFromStart } = require("../helper/getTimeFromStart");

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
router.get("/captions/:lectureId", async (req, res) => {
  lectureId = req.params.lectureId;
  try {
    const result = await CaptionFile.findOne({
      where: { lecture_id: lectureId },
    });
    console.log(result)
    if (!result) {
      let parser = new srtParser2();

      const panoptoEndpoint = "aucklandtest.au.panopto.com";
      const username = process.env.panopto_username;
      const password = process.env.panopto_password;
      const clientId = process.env.panopto_clientId;
      const clientSecret = process.env.panopto_clientSecret;
      console.log(username, password, clientId, clientSecret)
      const auth =
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      const authData = qs.stringify({
        grant_type: "password",
        username: username,
        password: password,
        scope: "api openid",
      });

      const authConfig = {
        method: "post",
        url: `https://${panoptoEndpoint}/Panopto/oauth2/connect/token`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: auth,
        },
        data: authData,
      };

      await axios(authConfig).then(async (response) => {
        const token = await response.data.access_token;

        const getCookieConfig = {
          method: "get",
          url: "https://aucklandtest.au.panopto.com/Panopto/api/v1/auth/legacyLogin",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        await axios(getCookieConfig).then(async (response) => {
          const cookie1 = await response.headers["set-cookie"][0];
          const cookie2 = await response.headers["set-cookie"][1];

          let getSrtConfig = {
            method: "get",
            url: `https://${panoptoEndpoint}/Panopto/Pages/Transcription/GenerateSRT.ashx?id=${lectureId}&language=0`,
            headers: {
              authority: panoptoEndpoint,
              "cache-control": "max-age=0",
              "sec-ch-ua-mobile": "?0",
              "upgrade-insecure-requests": "1",
              accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
              "sec-fetch-site": "none",
              "sec-fetch-mode": "navigate",
              "sec-fetch-user": "?1",
              "sec-fetch-dest": "document",
              "accept-language": "en-US,en;q=0.9",
              cookie: `${cookie1} ${cookie2}`,
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
        });
      });
    }

    const caption = await CaptionSentence.findAll({
      where: {
        CaptionFileLectureId: { [Op.eq]: lectureId },
      },
    });

    res.json({
      Caption_file: caption.map((x) => {
        return {
          id: x.id,
          start: x.start,
          body: x.body,
          edits: []
        };
      }),
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/edits/:sentenceId", async (req, res) => {
  console.log("test")
  sentenceId = req.params.sentenceId;

  try {
    const parentCapiton = await CaptionSentence.findAll({
      where: {
        id: sentenceId,
      },
    });

    if (!!parentCapiton.length) {
      await Edit.findAll({
        where: {
          CaptionSentenceId: sentenceId,
          reports: { [Op.lte]: 3 },
        },
      }).then(async (result) => {
        let toRet = [];

        for (let x = 0; x < result.length; x++) {
          const votes = await Vote.findAll({
            where: {
              EditId: { [Op.eq]: result[x].id },
            },
          });

          const upVotes = await votes.filter((x) => x.upvoted).length;
          const downVotes = await votes.filter((x) => !x.upvoted).length;

          toRet.push({
            id: result[x].id,
            body: result[x].body,
            reports: result[x].reports,
            createdAt: result[x].createdAt,
            updatedAt: result[x].updatedAt,
            CaptionSentenceId: result[x].CaptionSentenceId,
            UserId: result[x].UserId,
            upVotes: upVotes,
            downVotes: downVotes,
            votes: upVotes - downVotes,
          });
        }

        return res.json(toRet);
      });
    } else {
      res.status(404).send("Capiton not found");
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/edit", async (req, res) => {
  //check if edit exists, if it exist, just update the exist edit tuple
  const { sentenceId, body, upi } = req.body;
  try {
    let checkUser = await User.findOne({where: {upi: upi}})
    if (checkUser == null) {
      checkUser = await User.create({upi})
    }
    console.log(checkUser["dataValues"]["id"])
    const data = await Edit.build({
      body,
      reports: 0,
      CaptionSentenceId: sentenceId,
      UserId: checkUser["dataValues"]["id"]
    });
    await data.save();
    return res.json(data);
  } catch (err) {
    console.log(err);
  }
});

router.post("/vote", async (req, res) => {
  try {
    const { upvoted, EditId, UserId } = req.body;
    let update = { upvoted: upvoted };
    const result = await Vote.findOne({ where: { UserId, EditId } });
    //if the vote exists in the db
    if (result) {
      //if the vote exist and have the same value, we can just skip it
      if (result.upvoted === upvoted) {
        return res.json({
          message: "vote already exist",
          result,
        });
        //else we update the current vote
      } else {
        const change = await Vote.update(update, {
          where: {
            UserId,
            EditId,
          },
        });
        return res.json({
          message: "vote changed",
          change,
        });
      }
    }

    const data = await Vote.create({
      upvoted,
      EditId,
      UserId,
    });
    await data.save();
    return res.json({
      message: "vote created",
      data,
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/report", async (req, res) => {
  try {
    const { report, EditId, UserId } = req.body;

    const result = await Report.findOne({ where: { UserId, EditId } });
    //if the vote exist and have the same value, we assume the user wish to undo the report
    if (result) {
      console.log(result);
      await Report.destroy({
        where: {
          UserId,
          EditId,
        },
      });
      return res.json({
        message: "undo report",
        result,
      });
    }
    //create report if it does not exist
    else {
      const data = await Report.create({
        EditId,
        UserId,
      });
      await data.save();
      return res.json({
        message: "created new report",
        data,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
