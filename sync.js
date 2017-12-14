"use strict";

var models = require('./models');
const {sessionStore} = require('./models');
const {generateUsers} = require('./dummyData');

models.sequelize.sync({ force: true })
  .then(() => {
      console.log('Successfully updated database tables!');
      sessionStore.sync(); // Ensure Sessions table is updated
      console.log('Successfully created sessions table!');
      return;
  })
  .then(() => {
      models.User.bulkCreate([
        { fbId: 103948923732575,
          username: 'Donna Albcebdjbeffh Liangson',
          public: true,
          img: 'https://graph.facebook.com/103948923732575/picture?type=large'},
        { fbId: 106401333486629	,
          username: 'Ullrich Albcejbhghece Changberg',
          public: true,
          img: 'https://graph.facebook.com/106401333486629/picture?type=large'},
        { fbId: 108177133308282,
          username: 'Nancy Albcdgihgjcij Huisky',
          public: true,
          img: 'https://graph.facebook.com/108177133308282/picture?type=large'},
        { fbId: 118940982229432	,
          username: 'Joe Albcdjeicaafd Martinazzisen',
          public: true,
          img: 'https://graph.facebook.com/118940982229432/picture?type=large'},
        { fbId: 101116894012457,
          username: 'Open Graph Test User',
          public: true,
          img: 'https://graph.facebook.com/101116894012457/picture?type=large'}
      ])
      .then(() => {
        return models.User.findAll();
      })
      .then(users => {
        console.log("Users created successfully.");
        // console.log(users) // ... in order to get the array of user objects
        process.exit(0);
      })
  })
  .catch((error) => {
      console.log('Error updating database tables', error);
  	  process.exit(1);
  });
