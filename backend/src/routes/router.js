// Import modules
const express = require('express');
const router = express.Router();
const { Op } = require("sequelize");
const { v4: uuidv4, parse: uuidParse, stringify: uuidStringify } = require('uuid'); // Use in production

// Import database
const db = require('../models')

// Import models
const {
    sequelize,
    CaptionFile,
    CaptionSentence,
    Edit,
    Report,
    User,
    Vote
} = require('../models')

// Import mock data functions
const {
    captionFileData,
    captionSentenceData,
    editData,
    reportData,
    userData,
    voteData
} = require("../data.test/routerData.test");

router.get('/', async (req, res) => {
    await sequelize.sync({ force: true });

    // Add mock data
    await captionFileData(CaptionFile);
    await captionSentenceData(CaptionSentence);
    await editData(Edit);
    await reportData(Report);
    await userData(User);
    await voteData(Vote);

    res.send(`received on port: ${process.env.PORT}`)
});

router.get('/captions/:lectureId', (req, res) => {
    db.CaptionSentence.findAll({
        where: {
            body: { [Op.endsWith]: req.params.lectureId }
        }
    }).then((result) => {
        if (!result.length) {
            res.json({
                error: 404,
                message: "cannot find caption file"
            });
        } else {
            res.json({
                Caption_file: result.map(x => {
                    return {
                        id: x.id,
                        start: x.start,
                        captionSentence: x.body,
                        edits: {
                            approved: false,
                            id: 1,
                            body: "test",
                            timestamp: 100000000,
                            votes: 10,
                            voted: 0,
                            reports: 0,
                            reported: false
                        }
                    }
                })
            });
        }
    })
});

router.post('/new-caption', (req, res) => {
    const lectureId = req.body.lectureId;
    const editedCaption = req.body.editedCaptionBody;
    const captionSentenceId = req.body.captionSentenceId;

    //if there is no existing caption fot this id
    //create a new caption object in the db with ai generated caption
    db.CaptionSentence.findAll({
        where: {
            id: { [Op.eq]: lectureId }
        }
    }).then((result) => {
        if (!result.length) {
            // All generated catrion from existing API
        } else {
            db.CaptionSentence.update(
                { body: editedCaption },
                {
                    where: {
                        id: { [Op.eq]: lectureId }
                    }
                }
            ).then(() => {
                res.json({
                    lectureId: lectureId,
                    editedCaption: editedCaption,
                    captionSentenceId: captionSentenceId
                });
            })
        }
    })
});

router.post('/up-vote', (req, res) => {
    const lectureId = req.body.lectureId;
    const captionSentenceId = req.body.captionSentenceId;
    const editId = req.body.editId;

    db.CaptionSentence.findAll({
        where: {
            id: { [Op.eq]: lectureId }
        }
    }).then((result) => {
        if (result.length) {
            db.Edit.increment(
                "votes", {
                by: 1,
                where: {
                    id: { [Op.eq]: editId }
                }
            });

            db.Vote.build({
                upvoted: true
            }).save();
        }

        res.json({
            lectureId: lectureId,
            captionSentenceId: captionSentenceId,
            editId: editId
        });
    });
});

router.put('/down-vote', (req, res) => {
    //decrease vote for specified caption id and row id
});

module.exports = router
