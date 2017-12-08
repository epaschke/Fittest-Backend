const express = require('express');
const router = express.Router();
const axios = require('axios');

const { User } = require('./models');

router.post('/auth/addOrUpdate', function(req, res) {
  if (!req.body.token){
    res.status(400).json({
      statusCode: 400,
      success: false,
      error: "No token provided."});
  } else {
    // replace the access_token bit with a token retrieved from the body of the post
    axios.get(`https://graph.facebook.com/me?access_token=${req.body.token}`)
    .then(function(userObj) {
      // search for the user
      User.findOrCreate({
          where: {
            fbId: userObj.data.id
          },
          defaults: {
            fbId: userObj.data.id,
            public: false
          }
      })
      // once the async request completes
      .then(user => {
        if (user) {
          console.log("User exists!");
          res.status(200).send(
            {
              statusCode: 200,
              success: true,
              user: user[0].dataValues
            }
          );
        } else {
          res.send(
            {
              statusCode: 500,
              success: false,
              error: "Couldn't retrieve user data. Token may be expired."
            });
        }
      })
    })
    .catch(function(err) {
      console.log("Something went wrong while authenticating...");
      console.log(err.response);
      res.status(err.response.status || 500).send(
        {
          statusCode: err.response.status || 500,
          success: false,
          error: (err.response.data.error.message ? err.response.data.error.message : "Server error")}
      );
    })
  }
});

module.exports = router;
