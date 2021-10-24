async function tallyVotes(editID) {
  let voteSum = 0;
  const votes = await Vote.findAll({
    attributes: ['upvoted'],
    where: {
      EditId: editID,
    },
  });
  for (var i = 0; i < votes.length; i++) {
    let voteStatus = votes[i]['dataValues']['upvoted'];
    if (voteStatus == true) {
      voteSum += 1;
    } else if (voteStatus == false) {
      voteSum -= 1;
    }
  }
  return voteSum;
}
