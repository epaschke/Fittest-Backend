const express = require('express');
const router = express.Router();
const { User, Group, Activity, Membership, Trophy, Tourney, sequelize } = require('./models');
const Op = sequelize.Op;
const axios = require('axios');
const FB = require('fb');

const calcEndFn = (start) => {
  let date = new Date(start.valueOf());
  date.setDate(date.getDate() + 7);
  return date.toJSON();
};

//CREATION ROUTES
//create a new group
router.post('/new/group', async (req, res) => {
  try {
    //create group
    const groupId = await Group.create({
      name: req.body.name,
      description: req.body.description,
      public: req.body.public,
      groupImg: req.body.groupImg,
      startDate: new Date(req.body.startDate).toJSON()
    });
    //add self to group as admin
    await Membership.create({
      active: true,
      role: 'admin',
      groupId: groupId.dataValues.id,
      userId: req.user.id
    });
    //add tournament data
    await Tourney.create({
      groupId: groupId.dataValues.id,
      startDate: new Date(req.body.startDate).toJSON(),
      endDate: calcEndFn(req.body.startDate)
    });
    res.status(200).json({"success": true, groupId: groupId.dataValues.id});
  }
  catch (e) {
    console.log('Error creating group/membership:', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

//add new activity to self's profile
router.post('/new/activity', async (req, res) => {
  try {
    if (!req.body.name || !req.body.duration || !req.body.rigor) {
      throw "name, duration, and rigor are required fields."
    }
    let points;
    switch(req.body.rigor) {
      case 'casual':
        points = req.body.duration * 10;
        break;
      case 'moderate':
        points = req.body.duration * 20;
        break;
      default:
        points = req.body.duration * 30;
    };
    //create new activity for self
    const newActivity = await Activity.create({
      name: req.body.name,
      duration: req.body.duration,
      rigor: req.body.rigor,
      points: points,
      userId: req.user.id
    });
    res.status(200).json({ "success": true, "activityId": newActivity.dataValues.id });
  }
  catch (e) {
    console.log('Error creating activity: ', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

//add self or other person to group
router.post('/new/membership/:groupid', async (req, res) => {
  try {
    if (!parseInt(req.params.groupid)) {
      throw ("Group id must be an integer.");
    };
    if (req.body.addId){
      // if "addId" is a field, self is inviting someone else
      // makes new relationship with active set to false
      // invited user accepts by setting active to true
      await Membership.create({
        active: false,
        role: 'member',
        groupId: parseInt(req.params.groupid),
        userId: req.body.addId
      });
      res.status(200).json({"success": true});
    } else {
      //otherwise, self is adding self to group
      //active is true
      await Membership.create({
        active: true,
        role: 'member',
        groupId: parseInt(req.params.groupid),
        userId: req.user.id
      });
      res.status(200).json({"success": true});
    }
  }
  catch (e) {
    console.log('Error joining group/creating membership:', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

//view self profile
router.get('/view/user', async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    res.status(200).json({"success": true, user });
  }
  catch (e) {
    console.log('Error getting user to edit:', e);
    res.status(500).json({"success": false, "error": e});
  };
})

//EDIT ROUTES
//change another user to be an admin, current user must be an admin to make this change
router.post('/edit/membership/:groupid', async (req, res) => {
  try {
    if (!parseInt(req.params.groupid)) {
      throw ("Group id must be an integer.");
    };
    const checkAdmin = await Membership.findOne({
      attributes: ['role'],
      where: { groupId: req.params.groupid, userId: req.user.id }
    });
    if (checkAdmin.role === 'admin') {
      await Membership.update({ role: req.body.role},
        { where: { groupId: req.params.groupid, userId: req.body.userId } });
      res.status(200).json({ "success": true });
    } else {
      res.status(400).json({ "success": false, "error": 'You are not an admin.' });
    }
  }
  catch (e) {
    console.log('Error editing role:', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

//current user accepts invitation
router.get('/accept/invite/:groupid', async (req, res) => {
  try {
    if (!parseInt(req.params.groupid)) {
      throw ("Group id must be an integer.");
    };
    //change membership to active to accept
    await Membership.update({ active: true },
    { where: { groupId: req.params.groupid, userId: req.user.id } });
    res.status(200).json({ "success": true });
  }
  catch (e) {
    console.log('Error editing active status:', e);
    res.status(500).json({ "success": false, "error": e });
  };
})

//SEARCH ROUTES
//search for invited, public, or active groups
router.get('/search/:term', async (req, res) => {
  try {
    if (parseInt(req.params.term)) {
      throw ("Search term should be a string; either: 'invited', 'public', or 'active'. No groups found.");
    };
    switch(req.params.term){
      //groups self has been invited to
      case 'invited':
        const invitedGroups = await Group.findAll({
          include: [{ //get members of group
            model: User,
            attributes: [ 'id', 'username', 'img' ],
            through: Membership
          }]
        });
        //filter groups by those with active === false (invited) && user has relationship
        let invited = invitedGroups.filter((group) => {
          if (group.users.filter((user) => {
            return user.membership.active === false && user.membership.userId === req.user.id;
          }).length){
            return group;
          }
        });
        res.status(200).json({ "success": true, "groups": invited });
        break;
      //groups that are public to join
      case 'public':
        const publicGroups = await Group.findAll({
          include: { // get members of group
            model: User,
            attributes: ['id', 'username'],
            through: { model: Membership, where: { active: true } }},
          where: { public: true }
        });
        res.status(200).json({ "success": true, "groups": publicGroups});
        break;
      //groups that the user is currently in
      case 'active':
        const myGroups = await Group.findAll({
          include: [{ // get members
            model: User, attributes: ['id', 'username', 'img'],
            through: Membership
          }]
        });
        //filter by user's membership
        let filteredGroups = myGroups.filter((group) => {
          if (group.users.filter((user) => {
            return user.membership.active === true && user.membership.userId === req.user.id;
          }).length){
            return group;
          }
        });
        res.status(200).json({ "success": true, "groups": filteredGroups });
        break;
      default:
        res.status(500).json({"success": false, "error": "No specified search term. No groups found."});
    }
  }
  catch (e) {
    console.log('Error getting groups:', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

//get information for a single group
router.get('/groups/:groupid', async (req, res) => {
  try {
    if (!parseInt(req.params.groupid)) {
      throw ("Group id must be an integer.");
    };
    let group = await Group.findOne({
      where: { id: parseInt(req.params.groupid) },
      include: [{ // include members
        model: User,
        through: { model: Membership, attributes: ["role"] },
        include: { model: Activity, attributes: {exclude: ['id', 'userId', 'updatedAt']} }
      }, {
        model: Tourney, // include current tournament
        include: Trophy
      }]
    });
    console.log(group);
    res.status(200).json({"success": true, group });
  }
  catch (e) {
    console.log('Error getting single group:', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

//remove self from group
router.get('/leave/group/:groupid', async (req, res) => {
  try {
    if (parseInt(req.params.groupid).isNan()){
      throw "Group Id is not a number"
    }
    await Membership.destroy({ // delete relationship
      where: { userId: req.user.id, groupId: parseInt(req.params.groupid)}
    });
    res.status(200).json({"success": true})
  }
  catch (e){
    console.log('Error leaving group', e);
    res.status(500).json({ "success": false, "error": e})
  }
})

//USER ROUTES
//get self history of exercise
router.get('/user/history', async (req, res) => {
  try {
    const history = await Activity.findAll({ where: { userId: req.user.id } }); //all activities
    const totalPoints = await Activity.findAll({ // calculate points
      where: { userId: req.user.id },
      attributes: [[sequelize.fn('sum', sequelize.col('points')), 'total']]
    });
    res.status(200).json({ "success": true, totalPoints: totalPoints[0], history });
  }
  catch (e) {
    console.log('Error getting user history:', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

//change self between public and private
router.get('/user/toggle/public', async (req, res) => {
  try {
    const current = await User.findOne({ where: { id: req.user.id }, attributes: ['public'] });
    await User.update({ public: !current.public }, { where: { id: req.user.id }});
    res.status(200).json({ "success": true })
  }
  catch (e) {
    console.log('Error finding user to toggle public:', e);
    res.status(500).json({ "success": false, "error": e });
  }
});

//access user's trophy history
router.get('/user/trophies', async (req, res) => {
  try {
    const trophies = await Trophy.findAll({
      where: { userId: req.user.id }, // where user owns Trophy
      attributes: { exclude: ["createdAt", "updatedAt", "tourneyId"] },
      include: { // include tournament associated with Trophy
        model: Tourney,
        attributes: { exclude: ["createdAt", "updatedAt", "groupId"] },
        include: { model: Group, attributes: ["name", "id"] }
      }
    });
    res.status(200).json({"success": true, trophies})
  }
  catch (e) {
    console.log('Error getting trophies:', e);
    res.status(500).json({ "success": false, "error": e });
  }
});

//get winners for a single group
router.get('/winners/:groupid', async (req, res) => {
  try {
    if (parseInt(req.params.groupid).isNan()){
      throw "Group Id is not a number"
    }
    const winners = await Trophy.findAll({
      include: [ // include Tournament and User associated with Trophy
        { model: Tourney, where: { groupId: parseInt(req.params.groupid)}},
        { model: User, attributes: ['id', 'username', 'img']}
      ]
    });
    res.status(200).json({"success": true, winners})
  }
  catch (e){
    console.log('Error getting winners of group:', e);
    res.status(500).json({ "success": false, "error": e });

  }
})

//get another user's information
router.get('/user/:userid', async(req, res) => {
  try {
    if (!parseInt(req.params.userid)) {
      throw ("User id must be an integer.");
    };
    //find user
    const foundUser = await User.findOne({
      where: { id: req.params.userid, public: true },
      attributes: { exclude: ["fbId"] }, //hide certain things for privacy
      include: { // include groups
        model: Group,
        through: {
          model: Membership,
          where: { userId: { // common groups
            [Op.or]: [req.params.userid, req.user.id] } },
          attributes: []
        }
      }
    });
    res.status(200).json({"success": true, user: foundUser})
  }
  catch (e) {
    console.log('Error getting active groups:', e);
    res.status(500).json({ "success": false, "error": e });
  }
})

// Get all Facebook friends of a user that use the app.
// Also, will update the database with any new friends who have been added.
router.get('/my/friends', (req, res) => {
  console.log("/my/friends");
  var fb = FB.withAccessToken(req.query.token);
  fb.api(('/' + req.user.fbId + '/friends'), function(resp) {
    if (resp && resp.error) {
      if (resp.error.code === 'ETIMEDOUT') {
          console.log('Facebook request timeout.');
          res.status(503).json({success: false, friends: null, error: "Request timed out."});
      }
      else {
          console.log('error', resp.error);
          res.status(404).json({success: false, friends: null, error: resp.error.message })
      }
  }
  else {
      if (resp.data.length < 1) {
        res.status(200).json({success: true, friends: null});
      } else {
        var fbFriends = resp.data; // an array of Facebook user objects with name, fbId
        var fbIds = [];
        // Populate a list of user Facebook ids
        fbFriends.forEach(obj => {
          fbIds.push(obj.id);
        });
        // Search for all FunFit users with associated fbIds, and return them.
        console.log(fbIds);
        User.findAll({
            where: {
              fbId: {
                [Op.or]: [...fbIds]
              }
            }
        })
        .then(myFriends => {
          console.log("myFriends: " + myFriends);
          res.status(200).json({success: true, friends: myFriends});
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({success: false, error: err });
        });
      }
    }
  })
});


module.exports = router;
