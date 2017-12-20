"use strict";

var models = require('./models');
const {sessionStore} = require('./models');
const {generateUsers} = require('./dummyData');
const {createGroup} = require('./dummyData');
const {addMember} = require('./dummyData');
const {addActivities} = require('./dummyData');

models.sequelize.sync({ force: true })
  .then(() => {
      console.log('Successfully updated database tables!');
      sessionStore.sync(); // Ensure Sessions table is updated
      console.log('Successfully created sessions table!');
      return;
  })
  .then(() => {
     generateUsers();
     createGroup(2, "Jogging Buddiezzz", "Friends who run together.", Date.now());
     addMember(1, 3); // adds user #3 to group 1
     createGroup(1, "Tennis Friends", "Friends who play tennis.", Date.now());
     addMember(2, 4); // adds user #4 to group 2
     console.log("Completed successfully. Exiting...")
     addActivities();
  })
  .catch((error) => {
      console.log('Error updating database tables', error);
  	  process.exit(1);
  });
