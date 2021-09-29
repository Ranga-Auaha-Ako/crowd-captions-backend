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
    sentenceId = req.params.sentenceId;
    
    try{
        const parentCapiton = await CaptionSentence.findAll({
            where: {
                id: { [Op.eq]: sentenceId }
            }

        });

        if (!!parentCapiton.length) {
            await Edit.findAll({
                where: {
                    CaptionSentenceId: sentenceId,
                    reports: { [Op.lte]: 3},
                }
            }).then(async (result) => {
                let toRet = [];

                for (let x = 0; x < result.length; x++) {
                    const votes = await Vote.findAll({
                        where: {
                            EditId: { [Op.eq]: result[x].id }
                        }
                    });

                    const upVotes = await votes.filter(x => x.upvoted).length;
                    const downVotes = await votes.filter(x => !x.upvoted).length;

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
                        votes: upVotes - downVotes
                    });
                };

                return res.json(toRet);
            });
        } else {
            res.status(404).send("Capiton not found");
        }

    } catch(err) {
        console.log(err);
    }
})

router.post('/submitEdits', async(req, res) => {
    //check if edit exists, if it exist, just update the exist edit tuple
    const {sentenceId, body} = req.body
    try{
        const data = await Edit.build({
            body: `Edit content: ${body}`,
            reports: 0,
            CaptionSentenceId: sentenceId
        });
        await data.save();
        return res.json(data)
    }catch(err){
        console.log(err)
    } 
})

router.post('/vote', async(req, res) => {
    try{
        const {upvoted, EditId, UserId} = req.body
        
        const result = await Vote.findAll({where: {UserId, EditId}})
        if(result){
            //if the vote exist and have the same value, we can just skip it
            await Vote.destroy({
                where: {
                    UserId,
                    EditId
                }
            })
        }
        
        const data = await Vote.create({
            upvoted,
            EditId,
            UserId
        });
        console.log(EditId, UserId)
        await data.save();
        return res.json(data)
    }catch(err){
        console.log(err)
    } 
});

router.post('/report', async(req, res) => {
    try{
        const {report, EditId, UserId} = req.body
        
        const result = await Report.findOne({where: {UserId, EditId}})
        //if the vote exist and have the same value, we can just skip it
        if(result){
            console.log(result)
            await Report.destroy({
                where: {
                    UserId,
                    EditId
                }
            })
            return res.json({
                message: "report reset"
            })
        }
        else{
            const data = await Report.create({
                EditId,
                UserId
                
            });
            await data.save();
            return res.json(data)
        }
        
    }catch(err){
        console.log(err)
    } 
});

module.exports = router
