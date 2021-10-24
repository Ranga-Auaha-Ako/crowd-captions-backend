const { Op } = require("sequelize");

const {
  sequelize,
  CaptionFile,
  CaptionSentence,
  Edit,
  Report,
  User,
  Vote,
} = require("../models");

export const getEdits = async(sentenceId, upi, res) => {
    try {
      //fetch the parent caption sentence
        const parentCapiton = await CaptionSentence.findAll({
          where: {
            id: sentenceId,
          },
        });
        //check if the parent sentence exist
        if (!!parentCapiton.length) {
          await Edit.findAll({
            where: {
              CaptionSentenceId: sentenceId,
              reports: { [Op.lte]: 3 },
            },
          }).then(async (result) => {
            let toRet = [];
            
            //find votes for all the edits
            for (let x = 0; x < result.length; x++) {
              const votes = await Vote.findAll({
                where: {
                  EditId: { [Op.eq]: result[x].id },
                },
              });
              let hasUserUpVoted = null
    
              for (let i=0; i<votes.length; i++) {
                if (upi == votes[i]["dataValues"]["UserUpi"]) {
                  hasUserUpVoted = votes[i]["dataValues"]["upvoted"]
                }
                //console.log(votes[i] ) //["dataValues"]["upvoted"]
              }
    
              const upVotes = await votes.filter((x) => x.upvoted).length;
              const downVotes = await votes.filter((x) => !x.upvoted).length;
    
              //return the result to the front end
              toRet.push({
                id: result[x].id,
                body: result[x].body,
                reports: result[x].reports,
                createdAt: result[x].createdAt,
                updatedAt: result[x].updatedAt,
                CaptionSentenceId: result[x].CaptionSentenceId,
                UserId: result[x].UserId,
                upvoted: hasUserUpVoted,
                reported: null,
                upVotes: upVotes,
                downVotes: downVotes,
                votes: upVotes - downVotes,
              });
            }
            console.log(toRet)
            return res.json(toRet);
          });
        } else {
          //return error message if code does not run as intended
          res.status(404).send("Capiton not found");
        }
    } catch (err) {
        console.log(err);
    }
};

export const postEdits = async (sentenceId, body, upi, res) => {
  try {
    // check if body is too long
    if (body.length > 200) {
      return res.send("Edit should be less than 200 chracters")
    }
    //check if user exist
    let checkUser = await User.findOne({where: {upi: upi}})
    //create user if user not exist
    if (checkUser == null) {
      checkUser = await User.create({upi})
    }
    console.log(checkUser["dataValues"]["id"])
    //insert edit
    const data = await Edit.build({
      body,
      reports: 0,
      CaptionSentenceId: sentenceId,
      UserId: checkUser["dataValues"]["id"]
    });
    await data.save();
    return res.json(data);
  } catch (err) {
    console.log(err);
    return res.status(404).send("Caption Sentence does not exist")
  }
};

export const postVotes = async (upvoted, EditId, upi, res) => {
  try {
    let update = { upvoted: upvoted };
    console.log(upvoted, EditId, upi)
    const result = await Vote.findOne({ where: { UserUpi: upi, EditId } });
    //if the vote exists in the db
    if (result) {
      //if the vote exist and have the same value, we can just remove it
      if (result["dataValues"]["upvoted"] == (upvoted === 'true')) {
        Vote.destroy({ where: { EditId, UserUpi: upi } })
        return res.json({
          message: "vote removed"
        });
        //else we update the current vote
      } else {
        const change = await Vote.update(update, {
          where: {
            EditId,
            UserUpi: upi,
          },
        });
        return res.json({
          message: "vote changed",
          change
        });
      }
    }
    //if the vote does not exist we can create a new one
    const data = await Vote.create({
      upvoted,
      EditId,
      UserUpi: upi,
    });
    await data.save();
    console.log(data)
    return res.json({
      message: "vote created",
      data
    });
  } catch (err) {
    console.log(err);
  }
};

export const postReports = async (upvoted, EditId, UserUpi, res) => {
  try {
    const result = await Report.findOne({ where: { UserUpi, EditId } });
    //if the vote exist and have the same value, we assume the user wish to undo the report
    if (result) {
      console.log(result);
      await Report.destroy({
        where: {
          UserUpi,
          EditId,
        },
      });
      return res.json({
        message: "undo report",
        result,
      });
    }
    //create report if it does not exist
    else {
      const data = await Report.create({
        EditId,
        UserUpi,
      });
      await data.save();
      return res.json({
        message: "created new report",
        data,
      });
    }
  } catch (err) {
    console.log(err);
  }
};