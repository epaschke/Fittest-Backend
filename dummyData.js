const { User } = require('./models');
const { Group } = require('./models');
const { Membership } = require('./models');
const { Tourney } = require('./models');
const { Activity } = require('./models');

function generateUsers() {
  // Generate test users
    return User.bulkCreate([
    { fbId: 103948923732575,
      username: 'Donna Elizabeth Liangson',
      public: true,
      img: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Tittamari_Marttinen.jpg'},
    { fbId: 106401333486629	,
      username: 'Ullrich Albcejbhghece Changberg',
      public: true,
      img: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Joel_Aldor.jpg'},
    { fbId: 108177133308282,
      username: 'Nancy Daniela Huisky',
      public: true,
      img: 'https://www.state.gov/img/17/70059/Daniela_Nevarez_200_1.jpg'},
    { fbId: 118940982229432	,
      username: 'Joe Alberquerque Martinazzisen',
      public: true,
      img: 'https://upload.wikimedia.org/wikipedia/en/1/1f/Norman_Walsh.jpg'},
    { fbId: 101116894012457,
      username: 'Kev Hum Davy',
      public: true,
      img: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Humdavy.jpg'}
  ])
  .then(() => {
    console.log("Users created successfully.");
  })
  .catch(err => {
    console.log("Something went wrong while creating dummy users.");
    console.log("Error: " + err);
  })
};

function createGroup(adminId, name, desc, date, img) {
  var group;
  var endDate = new Date(date.valueOf());
  endDate = endDate.setDate(endDate.getDate() + 7);

  return Group.create({
      name: name,
      description: desc,
      public: true,
      groupImg: img,
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
  return Membership.create({
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
    console.log(e);
    process.exit(1);
  });
}

function addActivities(){
  return Activity.bulkCreate([
    {
      name: "Tennis",
      duration: 30,
      points: 600,
      rigor: "moderate",
      userId: 1
    },
    {
      name: "Tennis",
      duration: 50,
      points: 100,
      rigor: "moderate",
      userId: 1
    },
    {
      name: "Tennis",
      duration: 30,
      points: 600,
      rigor: "casual",
      userId: 3
    },
    {
      name: "Jogging",
      duration: 30,
      points: 100,
      rigor: "moderate",
      userId: 2
    },
    {
      name: "Running",
      duration: 30,
      points: 1700,
      rigor: "xTreme",
      userId: 4
    }
  ])
  .then(() => {
    console.log('Added activities to database.');
    process.exit(0);
  })
  .catch((e) => {
    console.log('Error adding activities to database.');
    console.log(e);
    process.exit(1);
  })
}

module.exports = {
  generateUsers,
  createGroup,
  addMember,
  addActivities
}
