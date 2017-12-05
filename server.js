const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const { User } = require('./models');



app.listen(PORT, error => {
error ? console.error(error) : console.log(`==> Listening on port ${PORT}.`);
});
