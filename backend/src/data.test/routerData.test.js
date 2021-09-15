const { v4: uuidv4 } = require('uuid');

export const captionFileData = async (captionFile) => {
    for (let i = 0; i < 10; i++) { // Add 10 rows
        const data = captionFile.build({ lecture_id: uuidv4() });
        await data.save();
    }
}

export const captionSentenceData = async (captionSentence) => {
    for (let i = 0; i < 10; i++) { // Add 10 rows
        const data = captionSentence.build({
            position: 1,
            start: new Date().getTime(),
            body: "This is a test string"
        });

        await data.save();
    }
}

export const editData = async (edit) => {
    for (let i = 0; i < 10; i++) { // Add 10 rows
        const data = edit.build({
            body: "This is a test body",
            approved: false,
            votes: 10,
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