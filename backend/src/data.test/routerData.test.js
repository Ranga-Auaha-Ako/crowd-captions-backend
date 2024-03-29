/*
This file contains all the functions required for populating the database with mock data
All functions will be triggered when the root location is accessed
*/

export const captionFileData = async (captionFile) => {
  for (let i = 0; i < 10; i++) {
    // Add 10 rows
    const data = captionFile.build({ lecture_id: (i + 1) * 100 });
    await data.save();
  }
};

export const createCaption = async (captionFile, captionSentence, id) => {
  const data = captionFile.build({ lecture_id: id });
  await data.save();
  for (let j = 0; j < 10; j++) {
    const data = captionSentence.build({
      position: j,
      start: new Date().getTime(),
      body: `This is a test string ${id}`,
      CaptionFileLectureId: id,
    });

    await data.save();
  }
};

export const captionSentenceData = async (captionSentence) => {
  for (let i = 0; i < 10; i++) {
    // Add 10 * 10 rows
    for (let j = 0; j < 10; j++) {
      const data = captionSentence.build({
        position: j,
        start: new Date().getTime(),
        body: `This is a test string ${(i + 1) * 100}`,
        CaptionFileLectureId: (i + 1) * 100,
      });

      await data.save();
    }
  }
};

export const editData = async (edit) => {
  for (let i = 0; i < 10; i++) {
    // Add 10 rows
    const data = edit.build({
      body: `This is a test body ${i + 1}`,
      approved: false,
      reports: 0,
      CaptionSentenceId: i + 1,
      UserId: i + 1,
    });

    await data.save();
  }
};

export const reportData = async (report) => {
  for (let i = 0; i < 10; i++) {
    // Add 10 rows
    const data = report.build({
      EditId: 1,
      UserId: i + 1,
    });
    await data.save();
  }
};

export const userData = async (user) => {
  for (let i = 0; i < 10; i++) {
    // Add 10 rows
    const data = user.build({
      access: 1,
      upi: 'abc123' + i,
    });

    await data.save();
  }
};

export const voteData = async (vote) => {
  for (let i = 0; i < 10; i++) {
    // Add 10 rows
    const data = vote.build({
      upvoted: Math.random() < 0.5,
      EditId: 1,
      UserId: i + 1,
    });

    await data.save();
  }
};

export const createMockData = async(
  sequelize,
  CaptionFile,
  CaptionSentence,
  User,
  Edit,
  Report,
  Vote) => {
  await sequelize.sync({ force: true });
  // populate the database with mock data, for testing purpose
  await captionFileData(CaptionFile);
  await captionSentenceData(CaptionSentence);
  await userData(User);
  await editData(Edit);
  await reportData(Report);
  await voteData(Vote);
}