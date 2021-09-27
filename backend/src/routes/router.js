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
    voteData,
    createCaption
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

router.get('/captions/:lectureId', async(req, res) => {
    lectureId = req.params.lectureId
    try{
        const result = await CaptionFile.findOne({
            where: {lecture_id: lectureId}
        })
        if(!result){
            await createCaption(CaptionFile, CaptionSentence, lectureId)
        }
        
        const caption = await CaptionSentence.findAll({
            where: {
                body: { [Op.endsWith]: lectureId}
            }
        })

        //const editArr = getEdits(caption, Edit, lectureId)

        res.json({
            Caption_file: caption.map(x => {
                return {
                    id: x.id,
                    start: x.start,
                    captionSentenceData: x.body,
                }
            })
        })
    } catch(err){
        console.log(err)
    }
})

router.get('/getEdits/:sentenceId', async(req, res) => {
    sentenceId = req.params.sentenceId
    try{
        const result = await Edit.findAll({
            where: {
                CaptionSentenceId: sentenceId
            }
        })
        return res.json(result.sort((x, y) => (x.votes < y.votes) ? 1 : -1));
    }catch(err){
        console.log(err)
    }
})

router.post('/submitEdits', async(req, res) => {
    const {sentenceId, body} = req.body
    try{
        const data = await Edit.build({
            body: `Edit content: ${body}`,
            approved: false,
            votes: 1,
            reports: 0,
            CaptionSentenceId: sentenceId
        });
        
        await data.save();
        return res.json(data)
    }catch(err){
        console.log(err)
    }
    
    
    
})

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

router.post('/down-vote', (req, res) => {
    const lectureId = req.body.lectureId;
    const captionSentenceId = req.body.captionSentenceId;
    const editId = req.body.editId;

    db.CaptionSentence.findAll({
        where: {
            id: { [Op.eq]: lectureId }
        }
    }).then((result) => {
        if (result.length) {
            db.Edit.decrement(
                "votes", {
                by: 1,
                where: {
                    id: { [Op.eq]: editId }
                }
            });

            db.Vote.build({
                upvoted: false
            }).save();
        }

        res.json({
            lectureId: lectureId,
            captionSentenceId: captionSentenceId,
            editId: editId
        });
    });
});

router.post('/report', (req, res) => {
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
                "reports", {
                by: 1,
                where: {
                    id: { [Op.eq]: editId }
                }
            });

            db.Report.build({}).save();
        }

        res.json({
            lectureId: lectureId,
            captionSentenceId: captionSentenceId,
            editId: editId
        });
    });
});

module.exports = router
