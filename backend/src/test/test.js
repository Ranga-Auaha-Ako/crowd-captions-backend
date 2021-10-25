var assert = require('assert');
require = require('esm')(module);
const {getBigString} = require("../helper/largeString")

// Import controller from endPoints
const {
  getCaptions,
  getEdits,
  postEdits,
  postVotes,
  postReports,
} = require("../controller/endPoints");

const {
  sequelize,
  CaptionFile,
  CaptionSentence,
  Edit,
  Report,
  User,
  Vote,
} = require('../models');

const arguments = [
  sequelize,
  CaptionFile,
  CaptionSentence,
  User,
  Edit,
  Report,
  Vote
]

const {createMockData} = require('../data.test/routerData.test');



describe('Post Edit', async () => {
    describe('Edit is too large', async () => {
        it('get edit error message', async () => {
          await createMockData(...arguments)
          await postEdits(1, getBigString(), "test123").then(result => assert.strictEqual(result, "Edit should be less than 200 chracters"))
        })
    })
    describe('Normal Edit', async () => {
        it('get stored edit', async () => {
          await createMockData(...arguments)
          await postEdits(1, "Hi markers ;)", "test123").then(result => {
            assert.strictEqual(result["dataValues"]["CaptionSentenceId"], 1)
            assert.strictEqual(result["dataValues"]["UserUpi"], "test123")
            assert.strictEqual(result["dataValues"]["body"], "Hi markers ;)")
            
          })
        })
    })
})

describe('Post Vote', async () => {
    describe('User is defaulty upvoting their submitted edit', async() => {
        it('should show user has upvoted as true when getting edits after user has voted', async() => {
          await createMockData(...arguments)
          await postEdits(1, "Hi markers ;)", "test123")
          await getEdits(1, "test123").then(result => {
            assert(result[1]["upvoted"] == true)
          })
          assert.strictEqual(true, true)
        })
    })
    describe('User is upvoting', async() => {
      it('show edit as upvoted by that user', async() => {
        await createMockData(...arguments)
        await postVotes(true, 1, "test123")
        await getEdits(1, "test123").then(result => {
          assert(result[0]["upvoted"] == true)
        })
      })
  })
    describe('User is un-upvoting', async() => {
      it('show edit as not voted by that user', async() => {
        await createMockData(...arguments)
        await postVotes("true", 1, "test123")
        await postVotes("true", 1, "test123")
        await getEdits(1, "test123").then(result => {
          assert(result[0]["upvoted"] == null)
        })
      })
    })
    describe('User is downvoting', async() => {
        it('Show edit as downvoted by that user', async() => {
          await createMockData(...arguments)
          await postVotes(false, 1, "test123")
          await getEdits(1, "test123").then(result => {
            assert(result[0]["upvoted"] == false)
          })
        })
    })
    describe('User is un-downvoting', async() => {
        it('show edit as not voted by that user',async () => {
          await createMockData(...arguments)
          await postVotes("false", 1, "test123")
          await postVotes("false", 1, "test123")
          await getEdits(1, "test123").then(result => {
            assert(result[0]["upvoted"] == null)
          })
        })
    })
})