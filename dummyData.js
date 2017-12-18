const { User } = require('./models');
const { Group } = require('./models');
const { Membership } = require('./models');
const { Tourney } = require('./models');
const { Activity } = require('./models');

function generateUsers() {
  // Generate test users
  User.bulkCreate([
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
    console.log("Users created successfully.");
  })
  .catch(err => {
    console.log("Something went wrong while creating dummy users.");
    console.log("Error: " + err);
  })
};

function createGroup(adminId, name, desc, date) {
  var group;
  var endDate = new Date(date.valueOf());
  endDate = endDate.setDate(endDate.getDate() + 7);

  Group.create({
      name: name,
      description: desc,
      public: true,
      groupImg: null,
      mission: null,
      startDate: date
  })
  .then((groupId) => {
    group = groupId.dataValues.id;
    console.log("Successfully created group #" + group);
    // Create a new membership to connect the creating user with their new group
    Membership.create({
      active: true,
      role: 'admin',
      groupId: group,
      userId: adminId
    })
    .then((mship) => {
      console.log("Successfully created Membership!");
      Tourney.create({
        groupId: group,
        startDate: date,
        endDate: endDate
      })
      .then((tourney) => {
        console.log("Successfully created tourney #" + tourney.dataValues.id);
      })
    })
  })
  .catch(e => {
    console.log('Error creating group/membership', e);
    process.exit(1);
  });
};

function addMember(groupId, userId){
  Membership.create({
    active: true,
    role: 'member',
    groupId: groupId,
    userId: userId
  })
  .then((mship) => {
    console.log("Successfully added user to group as a member!");
  })
  .catch((e) => {
    console.log('Error adding user to membership.')
    process.exit(1);
  });
}

function addActivities(){
  Activity.bulkCreate([
    {
      name: "Tennis",
      duration: 30,
      rigor: 2,
      points: 60,
      userId: 1
    },
    {
      name: "Tennis",
      duration: 50,
      rigor: 2,
      points: 100,
      userId: 1
    },
    {
      name: "Tennis",
      duration: 30,
      rigor: 1,
      points: 30,
      userId: 3
    },
    {
      name: "Jogging",
      duration: 30,
      rigor: 2,
      points: 60,
      userId: 2
    },
    {
      name: "Running",
      duration: 30,
      rigor: 3,
      points: 90,
      userId: 4
    }
  ])
  .then(() => {
    console.log('Added activities to database.');
    process.exit(0);
  })
  .catch((e) => {
    console.log('Error adding activities to database.');
    process.exit(1);
  })
}

module.exports = {
  generateUsers,
  createGroup,
  addMember,
  addActivities
}
