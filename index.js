const express = require("express")

const app = express();


var router = require('./routes/router');
const {sequelize, User, Vote, Edit} = require("./models")


app.use('/', router);

async function tallyVotes(editID) {
  let voteSum = 0
  const votes = await Vote.findAll(
    {
      attributes: ["upvoted"],
      where: {
        EditId: editID
      }
    })
  for (var i = 0; i < votes.length; i++) {
    let voteStatus = votes[i]["dataValues"]["upvoted"]
    if (voteStatus == true) {
      voteSum += 1
    } else if (voteStatus == false) {
      voteSum -= 1
    }
  }
  return voteSum
}

app.listen(async () => {
  await sequelize.sync({force: true})
  const edit = Edit.build({id: 1})
  const edit2 = Edit.build({id: 2})
  const edit3 = Edit.build({id: 3})
  await edit.save()
  await edit2.save()
  await edit3.save()
  for (var i=1; i<10; i++) {
    console.log(i)
    const vote = Vote.build({ id: i, upvoted: Boolean(i%2), EditId: (i%3)+1});
    await vote.save()
  }
  tallyVotes(1).then(result => console.log(result))
  console.log(`Example app listening at http://localhost:5432`);
});

app.use((req,res) => {
  res.status(404).send('404: Page not found');
})