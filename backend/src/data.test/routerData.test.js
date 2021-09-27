// Helper
const getRandomArbitrary = (min, max) => Math.random() * (max - min) + min;

export const captionFileData = async (captionFile) => {
    for (let i = 0; i < 10; i++) { // Add 10 rows
        const data = captionFile.build({ lecture_id: (i + 1) * 100 });
        await data.save();
    }
}

export const createCaption = async (captionFile,captionSentence, id) => {
    const data = captionFile.build({ lecture_id: id });
    await data.save();
    for (let j = 0; j < 10; j++) {
        const data = captionSentence.build({
            position: j,
            start: new Date().getTime(),
            body: `This is a test string ${id}`
        });

        await data.save();
    }
}

export const getEdits = async (sentenceArr, Edit, lectureId) => {
    
}

export const captionSentenceData = async (captionSentence) => {
    for (let i = 0; i < 10; i++) { // Add 10 * 10 rows
        for (let j = 0; j < 10; j++) {
            const data = captionSentence.build({
                position: j,
                start: new Date().getTime(),
                body: `This is a test string ${(i + 1) * 100}`,
            });

            await data.save();
        }
    }
}

export const editData = async (edit) => {
    for (let i = 0; i < 10; i++) { // Add 10 rows
        const data = edit.build({
            body: `This is a test body ${i + 1}`,
            approved: false,
            votes: Math.round(getRandomArbitrary(0, 100)),  // Test, get random number of votes
            reports: 0
        });

        await data.save();
    }
}

export const reportData = async (report) => {
    for (let i = 0; i < 10; i++) { // Add 10 rows
        const data = report.build();
        await data.save();
    }
}

export const userData = async (user) => {
    for (let i = 0; i < 10; i++) { // Add 10 rows
        const data = user.build({
            access: 1,
            upi: "abc123"
        });

        await data.save();
    }
}

export const voteData = async (vote) => {
    for (let i = 0; i < 10; i++) { // Add 10 rows
        const data = vote.build({
            upvoted: false
        });

        await data.save();
    }
}
