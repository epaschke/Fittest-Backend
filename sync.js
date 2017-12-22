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
     await createGroup(2, "Spar Pals", "I challenge you to a DUEL.", new Date,
        'https://s9.postimg.org/ub6rxcxhb/fencing_graphic.png');
     await addMember(1, 3); // adds user #3 to group 1
     await createGroup(1, "SOMA Tennis", "Play doubles with us!",
        new Date, 'https://s9.postimg.org/tyfdr8kdb/tennis_graphic.png');
     await addMember(2, 4); // adds user #4 to group 2
     await createGroup(3, "B-ball Buddies", "Fight me on the court, m8!", new Date,
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Emojione_1F3C0.svg/200px-Emojione_1F3C0.svg.png');
     await addMember(3, 5);
     await addMember(3, 6);
     await addMember(3, 7);
     await addActivities();
   }
catch(e){
  console.log('Error updating database tables', e);
  process.exit(1);
  }
};

syncData();
