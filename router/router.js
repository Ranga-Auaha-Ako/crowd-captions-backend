var express = require('express'),
    router = express.Router();

router.get('/', (req, res) => {
    res.send('received')
})

module.exports = router