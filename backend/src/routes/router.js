// Import modules
var express = require('express');
var router = express.Router();

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

router.get('/captions', (req, res) => {
    db.CaptionFile.findAll().then((result) => res.json(result))
});

router.post('/new-caption', (req, res) => {
    //if there is no existing caption fot this id
    //create a new caption object in the db with ai generated caption
    Caption.create({
        //create a new caption object
    }).catch((err) => {
        if (err) {
            console.log(err);
        }
    });
});

router.put('/changed-caption', (req, res) => {
    //update caption under same id
});

router.put('/up-vote', (req, res) => {
    //incretment vote for specified caption id and row id
});

router.put('/down-vote', (req, res) => {
    //decrease vote for specified caption id and row id
});

module.exports = router