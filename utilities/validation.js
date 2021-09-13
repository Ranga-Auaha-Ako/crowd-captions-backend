const validator = require("validator")

module.exports = {
    checkLectureID: function (lectureID) {
        return validator.isUUID(lectureID)
    },    
    checkEditSize: function (edit) {
        return validator.isLength(edit, {min: 0, max: 200})
    }
}


