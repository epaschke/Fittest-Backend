const express = require('express');
// const router = express();
const router = express.Router();
// const bodyParser = require('body-parser');
// const PORT = process.env.PORT || 3000;
const { User, Group, Activity, Membership, Trophy, Tourney, sequelize } = require('./models');
const Op = sequelize.Op;
// router.use(bodyParser.json());

const calcEndFn = (start) => {
  let date = new Date(start.valueOf());
  date.setDate(date.getDate() + 7);
  return date.toJSON();
};

  //CREATION ROUTES
  router.post('/new/group', async (req, res) => {
    try {
      const groupId = await Group.create({
        name: req.body.name,
        description: req.body.description,
        public: req.body.public,
        groupImg: req.body.groupImg,
        startDate: req.body.startDate
      });
      await Membership.create({
        active: true,
        role: 'admin',
        groupId: groupId.dataValues.id,
        userId: req.user.id
      });
      await Tourney.create({
        groupId: groupId.dataValues.id,
        startDate: req.body.startDate,
        endDate: calcEndFn(req.body.startDate)
      });
      res.status(200).json({"success": true, groupId: groupId.dataValues.id});
    }
    catch (e) {
      console.log('Error creating group/membership', e);
      res.status(500).json({ "success": false, "error": e });
    };
  });

  router.post('/new/activity', async (req, res) => {
    try {
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
      const newActivity = await Activity.create({
        name: req.body.type,
        duration: req.body.duration,
        rigor: req.body.rigor,
        points: points,
        userId: req.user.id
      });
      res.status(200).json({ "success": true, "activityId": newActivity.dataValues.id });
    }
    catch (e) {
      console.log('Error creating activity', e);
      res.status(500).json({ "success": false, "error": e });
    };
  });

  router.post('/new/membership/:groupid', async (req, res) => {
    try {
      if (req.body.addId){
        await Membership.create({
          active: false,
          role: 'member',
          groupId: req.params.groupid,
          userId: req.body.addId
        });
        res.status(200).json({"success": true});
      } else {
        await Membership.create({
          active: true,
          role: 'member',
          groupId: req.params.groupid,
          userId: req.user.id
        });
        res.status(200).json({"success": true});
      }
    }
    catch (e) {
      console.log('Error joining group/creating membership', e);
      res.status(500).json({ "success": false, "error": e });
    };
  });

  //TEMPORARY FORCE END TOURNEY
  router.get('/end/tourney/:tourneyid', async (req, res) => {
    try {
    const tourneySE = await Tourney.findOne({
      where: { id: req.params.tourneyid },
      attributes: [ "startDate", "endDate" ]
    });
    const tourney = await Tourney.findOne({
      where: { id: req.params.tourneyid },
      include: {
        model: Group,
        attributes: [ "name" ],
        include: {
          model: User,
          attributes: [ "id" ],
          where: { public: true },
          through: { model: Membership, attributes: [] },
          include: {
            model: Activity,
            attributes: ['points'],
            where: { createdAt: { [Op.between]: [tourneySE.dataValues.startDate, tourneySE.dataValues.endDate] } }
          }
        }
      }
    });
    let hashTotals = {};
    let sort = tourney.group.users.map(u => {
      let total = 0;
      switch(u.dataValues.activities.length){
        case 0:
          break;
        case 1:
          total = u.dataValues.activities[0].points;
          break;
        default:
          total = u.dataValues.activities.reduce((a, b) => {
            return a.dataValues.points + b.dataValues.points;
          });
      }
      hashTotals[u.id] = total;
      return total;
    });
    let winning = sort.sort()[0];
    let winner;
    Object.keys(hashTotals).map(userid => {
      if (hashTotals[userid] === winning){
        winner = userid
      }
    });
    await Trophy.create({
      date: tourney.endDate,
      points: hashTotals[winner],
      userId: winner,
      tourneyId: tourney.id
    });
    res.status(200).json({"success": true, tourney, winner })
  }
  catch (e) {
    console.log(e);
    res.status(500).json({"success": false, "error": e})
  }
  });

  //EDIT ROUTES
  router.post('/edit/user', async (req, res) => {
    try {
      const user = await User.findOne({ where: { id: req.user.id } });
      res.status(200).json({"success": true, user });
    }
    catch (e) {
      console.log('Error getting user to edit:', e);
      res.status(500).json({"success": false, "error": e});
    };
  })

  router.post('/edit/membership/:groupid', async (req, res) => {
    try {
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
      console.log('Error editing role', e);
      res.status(500).json({ "success": false, "error": e });
    };
  });

  router.get('/accept/invite/:groupid', async (req, res) => {
    try {
      await Membership.update({ active: true },
      { where: { groupId: req.params.groupid, userId: req.user.id } });
      res.status(200).json({ "success": true });
    }
    catch (e) {
      console.log('Error editing active status', e);
      res.status(500).json({ "success": false, "error": e });
    };
  })

  //SEARCH ROUTES
  router.get('/search/:term', async (req, res) => {
    try {
      switch(req.params.term){
        case 'invited':
          const invitedGroups = await Group.findAll({
            include: [{
              model: User,
              through: { model: Membership, where: { active: false } },
              where: { id: req.user.id }
            }]
          });
          res.status(200).json({ "success": true, "groups": invitedGroups });
          break;
        case 'public':
          const publicGroups = await Group.findAll({
            where: { public: true }
          });
          res.status(200).json({ "success": true, "groups": publicGroups});
          break;
        case 'active':
          const myGroups = await Group.findAll({
            include: [{
              model: User, attributes: [],
              through: { model: Membership, where: { active: true } },
              where: { id: req.user.id }
            }]
          });
          res.status(200).json({ "success": true, "groups": myGroups });
          break;
        default:
          res.status(500).json({"success": false, "error": "No specified search term. No groups found."});
      }
    }
    catch (e) {
      console.log('Error getting groups', e);
      res.status(500).json({ "success": false, "error": e });
    };
  });

  router.get('/groups/:groupid', async (req, res) => {
    try {
      let group = 'test';
      group = await Group.findOne({
        where: { id: parseInt(req.params.groupid) },
        include: {
          model: User, attributes: ["username", "id"], where: { public: true },
          through: { model: Membership, attributes: ["role"] },
          include: { model: Activity, attributes: {exclude: ['id', 'userId', 'updatedAt']} }
        }
      });
      console.log(group);
      res.status(200).json({"success": true, group });
    }
    catch (e) {
      console.log('Error getting active groups', e);
      res.status(500).json({ "success": false, "error": e });
    };
  });
  //FIND FRIEND ROUTE
  router.get('/user/:userid', async(req, res) => {
    try {
      const friend = await User.findOne({
        where: { id: req.params.userid, public: true },
        attributes: { exclude: ["fbId"] },
        include: {
          model: Group,
          through: {
            model: Membership,
            where: { userId: {
              [Op.or]: [req.params.userid, req.user.id] } },
            attributes: []
          }
        }
      });
      res.status(200).json({"success": true, friend })
    }
    catch (e) {
      console.log('Error getting active groups', e);
      res.status(500).json({ "success": false, "error": e });
    }
  })

  //USER ROUTES
  router.get('/user/history', async (req, res) => {
    try {
      const history = await Activity.findAll({ where: { userId: req.user.id } });
      const totalPoints = await Activity.findAll({
        where: { userId: req.user.id },
        attributes: [[sequelize.fn('sum', sequelize.col('points')), 'total']]
      });
      res.status(200).json({ "success": true, totalPoints: totalPoints[0], history });
    }
    catch (e) {
      console.log('Error getting user history', e);
      res.status(500).json({ "success": false, "error": e });
    };
  });

  router.get('/user/toggle/public', async (req, res) => {
    try {
      const current = await User.findOne({ where: { id: req.user.id }, attributes: ['public'] });
      await User.update({ public: !current.public }, { where: { id: req.user.id }});
      res.status(200).json({ "success": true })
    }
    catch (e) {
      console.log('Error finding user to toggle public', e);
      res.status(500).json({ "success": false, "error": e });
    }
  });

  router.get('/user/trophies', async (req, res) => {
    try {
      const trophies = await Trophy.findAll({
        where: { userId: req.user.id },
        attributes: { exclude: ["createdAt", "updatedAt", "tourneyId"] },
        include: {
          model: Tourney,
          attributes: { exclude: ["createdAt", "updatedAt", "groupId"] },
          include: { model: Group, attributes: ["name", "id"] }
        }
      });
      res.status(200).json({"success": true, trophies})
    }
    catch (e) {
      console.log('Error getting trophies', e);
      res.status(500).json({ "success": false, "error": e });
    }
  });

  module.exports = router;

// router.listen(PORT, error => {
// error ? console.error(error) : console.log(`==> Listening on port ${PORT}.`);
// });
