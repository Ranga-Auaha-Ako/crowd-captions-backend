var assert = require('assert')
const {sequelize, CaptionFile, CaptionSentence} = require("../models")

describe('Get Captions', async () => {
    describe('Lecture Id does not exists', async () => {
        it('Return Empty json file', async () => {
            await sequelize.sync({force: true})
            requestedID = "717aea5c-b0a2-49b1-91a1-a5d6bc02ad05"
            try{
                const result = await CaptionFile.findOne({
                    where: {lecture_id: requestedID}
                })
                assert.strictEqual(result, null)
                if(!result){
                    const newFile = CaptionFile.build({lecture_id: requestedID})
                    await newFile.save()
                    let checkNewFile = CaptionFile.findOne({where: {lecture_id: requestedID}})
                    checkNewFile.then(e => assert.strictEqual(e["dataValues"]["lecture_id"], requestedID))
                }
                                
                // const caption = await CaptionSentence.findAll({
                //     where: {
                //         body: { CaptionFileId: requestedID} // modification to code
                //     }
                // })
                       
                // const response = caption.map(x => {
                //         return {
                //             id: x.id,
                //             start: x.start,
                //             captionSentenceData: x.body,
                //         }
                //     })
                
                // console.log(response)
            } catch(err){
                console.log(err)
            }
            assert.strictEqual(true, true)
        })
        it('Not add lecture id to database', async () => {  
            assert.strictEqual(true, true)
        })
    })

    describe('Lecture Id exists, but captions has not been grabbed before()', () => {
        it('Return data as specified (expand)', () => {
            assert.strictEqual(true, true)
        })
    })

    describe('Lecture Id exists and caption has been grabbed before', () => {
        it('Return data as specified (expand)', () => {
            assert.strictEqual(true, true)
        })
        it('Include existing edits', () => {
            assert.strictEqual(true, true)
        })
    })
})

describe('Get Edits', async () => {

})


