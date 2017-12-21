const express = require('express');
const router = express.Router();
const axios = require('axios');

const { User } = require('./models');

module.exports = function(passport) {

  router.get('/auth/logout', function(req, res, next) {
    req.session.destroy(function(err) {
      res.status(200).send({
        statusCode: 200,
        success: true
      });
    });
  });

  router.post('/auth/signInUp', function(req, res) {
    // Verify that a token was passed in with the body.
    if (!req.body.token) {
      res.status(400).json({
        statusCode: 400,
        success: false,
        error: "No token provided."
      });
    } else {
      // Make a request to the Facebook Graph API using the token from the front end
      console.log("Making request to FB Graph API...")
      axios.get(`https://graph.facebook.com/me?access_token=${req.body.token}`)
      .then(function(userObj) {

        // Facebook should return an object with keys id and name.
        console.log("Facebook responded with:" + userObj.status + " " +
            userObj.statusText);

        console.dir(userObj.data)
        // With the FB user info, find or create an associated Postgres user.
        User.findCreateFind({
            where: {
              fbId: userObj.data.id
            },
            defaults: {
              username: userObj.data.name,
              fbId: userObj.data.id,
              public: true,
              img: 'https://graph.facebook.com/' + userObj.data.id + '/picture?type=large' // Security setting; user profiles are private by default
            }
        })
        .then(user => {
          console.log("Search for user in postgres completed.");

          console.log(user[0].dataValues);
          // If postgres was able to find or create a user, log them in and
          // return JSON with their postgres data.
          if (user) {
            console.log("User exists!");

            // User login should go here... if I can get this thing to actually respond
            req.login(user[0].dataValues, function(err) {
              if (err) {
                 console.log(err);
                 res.status(500).send({
                   statusCode: 500,
                   success: false,
                   error: err
                 })
              } else {
                res.status(200).send(
                  {
                    statusCode: 200,
                    success: true,
                    user: user[0].dataValues,
                    userObj: userObj.data
                  }
                );
              }
            })

          } else {
            // If postgres wasn't able to find or create a user. Could be a
            // database error of some sort...
            console.log("User could not be created or retrieved.")
            res.send(
              {
                statusCode: 500,
                success: false,
                error: "Couldn't retrieve/store user data."
              }
            );
          };
        }) // closes inner .then()
      }) // closes outer .then()

      .catch(function(err) {

        console.log("An exception occurred while attempting to retrieve user data.");
        console.log("Error: " + err.response);

        res.status(err.response.status || 500).send(
          {
            statusCode: err.response.status || 500,
            success: false,
            error: (err.response.data.error.message ? err.response.data.error.message : "Server error")
          });
      });
    }
  });

  return router;
};
