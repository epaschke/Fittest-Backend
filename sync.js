"use strict";

var models = require('./models');
const {sessionStore} = require('./models');
const {generateUsers} = require('./dummyData');
const {createGroup} = require('./dummyData');
const {addMember} = require('./dummyData');
const {addActivities} = require('./dummyData');

const syncData = async () => {
  try {
    await models.sequelize.sync({ force: true })
    console.log('Successfully updated database tables!');
    await sessionStore.sync(); // Ensure Sessions table is updated
    console.log('Successfully created sessions table!');
     await generateUsers();
     await createGroup(2, "Jogging Buddiezzz", "Friends who run together.", new Date, 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Fxemoji_u1F3C3.svg');
     await addMember(1, 3); // adds user #3 to group 1
     await createGroup(1, "Tennis Friends", "Friends who play tennis.", new Date, 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Emojione_1F3BE.svg');
     await addMember(2, 4); // adds user #4 to group 2
     await addActivities();
   }
catch(e){
  console.log('Error updating database tables', e);
  process.exit(1);
  }
};

syncData();
