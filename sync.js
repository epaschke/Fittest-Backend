"use strict";

var models = require('./models');
const {sessionStore} = require('./models');

models.sequelize.sync({ force: true })
  .then(() => {
      console.log('Successfully updated database tables!');
      sessionStore.sync(); // Ensure Sessions table is updated
    	process.exit(0);
  })
  .catch((error) => {
      console.log('Error updating database tables', error);
  	  process.exit(1);
  });
