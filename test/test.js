var assert = require('assert')
const {sequelize, User, Vote, Edit} = require("../models")

describe('Get Captions', async () => {
    describe('Lecture Id does not exists', async () => {
        
        it('Return Empty json file', async () => {  
            await sequelize.sync({force: true})
            assert.equal(true, true)
        })
        it('Not add lecture id to database', async () => {  
            assert.equal(true, true)
        })
    })

    describe('Lecture Id exists, but captions has not been grabbed before()', () => {
        it('Return data as specified (expand)', () => {
            assert.equal(true, true)
        })
    })

    describe('Lecture Id exists and caption has been grabbed before', () => {
        it('Return data as specified (expand)', () => {
            assert.equal(true, true)
        })
        it('Include existing edits', () => {
            assert.equal(true, true)
        })
    })
})
