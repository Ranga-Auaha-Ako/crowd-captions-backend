import'dotenv/config';
import express from 'express';

const app = express();

var router = require('./routes/router');

app.use('/', router);

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});

app.use((req,res) => {
  res.status(404).send('404: Page not found');
})

module.exports = app;