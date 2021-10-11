// import'dotenv/config';
const express = require("express")
require = require('esm')(module);

console.log("234234")

const app = express();

var router = require('./routes/router');

app.use('/', router);

app.listen(8080, () => {
  console.log(`Example app listening at http://localhost:8080`);
});

app.use((req,res) => {
  res.status(404).send('404: Page not found');
})

module.exports = app;