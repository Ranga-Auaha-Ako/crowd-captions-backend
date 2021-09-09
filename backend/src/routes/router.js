var express = require('express'),
    router = express.Router();

const db = require('../models')

const { CaptionFile, sequelize } = require('../models')


router.get('/', async (req, res) => {
    await sequelize.sync({ force: true });

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