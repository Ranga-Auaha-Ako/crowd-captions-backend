var express = require('express'),
    router = express.Router();

router.get('/', (req, res) => {
    res.send(`received on port: ${process.env.PORT}`)
})

module.exports = router