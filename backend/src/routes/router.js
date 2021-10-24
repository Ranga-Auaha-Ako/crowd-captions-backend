/*
This file contains all the end points, each will calls a function in controller/endPoints.js
for data processing, database accessing and modification
*/

// Import modules
const express = require('express');
const axios = require('axios');
const qs = require('qs');
const router = express.Router();
const { Op } = require('sequelize');
const { default: srtParser2 } = require('srt-parser-2');

// Import database
const db = require('../models');

// Import helper
const { getTimeFromStart } = require('../helper/getTimeFromStart');

// Import models as database relations
const {
  sequelize,
  CaptionFile,
  CaptionSentence,
  Edit,
  Report,
  User,
  Vote,
} = require('../models');

// Import mock data functions fron routerData
const {
  captionFileData,
  captionSentenceData,
  editData,
  reportData,
  userData,
  voteData,
  createCaption,
} = require('../data.test/routerData.test');

// Import controller from endPoints
const {
  getEdits,
  postEdits,
  postVotes,
  postReports,
} = require('../controller/endPoints');

//handle request which access to root
router.get('/', async (req, res) => {
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

// Test with id: 9592f9fc-0af4-49b8-9e38-ad6b004d17df
//handle request for the access to a lecture's caption
router.get('/captions/:lectureId', async (req, res) => {
  lectureId = req.params.lectureId;
  //attempt to locate the caption file in the database
  try {
    const result = await CaptionFile.findOne({
      where: { lecture_id: lectureId },
    });
    console.log(result);
    //call Panopto API for a AI generated caption file if theres no file in the database
    if (!result) {
      let parser = new srtParser2();

      const panoptoEndpoint = 'aucklandtest.au.panopto.com';
      const username = process.env.panopto_username;
      const password = process.env.panopto_password;
      const clientId = process.env.panopto_clientId;
      const clientSecret = process.env.panopto_clientSecret;
      console.log(username, password, clientId, clientSecret);
      const auth =
        'Basic ' +
        Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const authData = qs.stringify({
        grant_type: 'password',
        username: username,
        password: password,
        scope: 'api openid',
      });

      const authConfig = {
        method: 'post',
        url: `https://${panoptoEndpoint}/Panopto/oauth2/connect/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: auth,
        },
        data: authData,
      };

      await axios(authConfig).then(async (response) => {
        const token = await response.data.access_token;

        const getCookieConfig = {
          method: 'get',
          url: 'https://aucklandtest.au.panopto.com/Panopto/api/v1/auth/legacyLogin',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        await axios(getCookieConfig).then(async (response) => {
          const cookie1 = await response.headers['set-cookie'][0];
          const cookie2 = await response.headers['set-cookie'][1];

          let getSrtConfig = {
            method: 'get',
            url: `https://${panoptoEndpoint}/Panopto/Pages/Transcription/GenerateSRT.ashx?id=${lectureId}&language=0`,
            headers: {
              authority: panoptoEndpoint,
              'cache-control': 'max-age=0',
              'sec-ch-ua-mobile': '?0',
              'upgrade-insecure-requests': '1',
              accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
              'sec-fetch-site': 'none',
              'sec-fetch-mode': 'navigate',
              'sec-fetch-user': '?1',
              'sec-fetch-dest': 'document',
              'accept-language': 'en-US,en;q=0.9',
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

    //return all the caption sentences with its best edits
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
          edits: [],
        };
      }),
    });
  } catch (err) {
    console.log(err);
  }
});

//query the edits of one sentence
router.get('/edits/:sentenceId/:upi', async (req, res) => {
  let { sentenceId, upi } = req.params;

  await getEdits(sentenceId, upi, res);
});

//insert new edits into the database
router.post('/edit', async (req, res) => {
  const { sentenceId, body, upi } = req.body;

  await postEdits(sentenceId, body, upi, res);
});

//insert new vote into the database
router.post('/vote', async (req, res) => {
  const { upvoted, EditId, upi } = req.body;

  await postVotes(upvoted, EditId, upi, res);
});

//insert new report into the database
router.post('/report', async (req, res) => {
  const { report, EditId, UserUpi } = req.body;

  await postReports(report, EditId, UserUpi, res);
});

module.exports = router;
