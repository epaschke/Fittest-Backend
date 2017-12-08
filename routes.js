const express = require('express');
const router = express.Router();
const { User, Group, Activity, Membership } = require('./models');

router.post('/new/user', async (req, res) => {
  try {
    await User.create({ fbId: req.body.fbId, public: true, img: req.body.img, username: req.body.username });
    res.status(200).json({"success": true});
  }
  catch (e) {
    console.log('Error creating user', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

router.post('/new/group', async (req, res) => {
  try {
    const groupId = await Group.create({ name: req.body.name, description: req.body.description, ongoing: false, public: false, groupImg: req.body.groupImg });
    await Membership.create({ active: true, role: 'admin', groupId: groupId, userId: req.user.id });
    res.status(200).json({"success": true});
  }
  catch (e) {
    console.log('Error creating group/membership', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

router.post('/new/activity', async (req, res) => {
  try {
    const points;
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
    await Activity.create({ name: req.body.type, duration: req.body.duration, rigor: req.body.rigor, points: points, userId: req.user.id });
    res.status(200).json({"success": true});
  }
  catch (e) {
    console.log('Error creating activity', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

router.post('/new/membership/:groupid', async (req, res) => {
  try {
    if (req.body.addId){
      await Membership.create({ active: false, role: 'member', groupId: req.params.groupid, userId: req.body.addId });
      res.status(200).json({"success": true});
    } else {
      await Membership.create({ active: true, role: 'member', groupId: req.params.groupid, userId: req.user.id });
      res.status(200).json({"success": true});
    }
  }
  catch (e) {
    console.log('Error joining group/creating membership', e);
    res.status(500).json({ "success": false, "error": e });
  };
})

router.post('/edit/membership/:groupid/role', async (req, res) => {
  try {
    const checkAdmin = Membership.findOne({ attributes: ['role'], where: { groupId: req.params.groupid, userId: req.user.id}});
    if checkAdmin.role === 'admin'{
      await Membership.update({ role: req.body.role }, { where: { groupId: req.params.groupid, userId: req.body.userId });
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

router.post('/accept/invite/:groupid', async (req, res) => {
  try {
    await Membership.update({ active: true }, { where: { groupId: req.params.groupid, userId: req.user.id }});
    res.status(200).json({ "success": true });
  }
  catch (e) {
    console.log('Error editing active status', e);
    res.status(500).json({ "success": false, "error": e });
  };
})

router.get('/find/groups/all', async (req, res) => {
  try {
    const allGroups = await Group.find({ where: { $or: [{ public: true },
      { include: [{ model: Membership, where: { userId: req.user.id, groupId: Sequelize.col('group.id'), active: false } }] }
      ] });
    res.status(200).json({ "success": true, "groups": allGroups });
  }
  catch (e) {
    console.log('Error getting groups', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

router.get('/groups/active', async (req, res) => {
  try {
    const myGroups = await Group.find({ include: [{
      model: Membership, where: { userId: req.user.id, groupId: Sequelize.col('group.id'), active: true }
    }]});
    res.status(200).json({ "success": true, "groups": myGroups });
  }
  catch (e) {
    console.log('Error getting active groups', e);
    res.status(500).json({ "success": false, "error": e });
  };
})

router.get('/groups/:groupid', async (req, res) => {
  try {
    const group = await Group.findOne({ where: { id: req.params.groupid } });
    const members = await Membership.find({ where: { groupId: req.params.groupid }, include: [
      { model: User, attributes: ['username', 'totalPoints'] }
    ]});
    res.status(200).json({"success": true, "group": group });
  }
  catch (e) {
    console.log('Error getting active groups', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

router.get('/user/history/activity', async (req, res) => {
  try {
    const activities = await Activity.find({ order: ['createdAt', 'DESC'], where: { userId: req.user.id } });
    res.status(200).json({ "success": true, "history": activities });
  }
  catch (e) {
    console.log('Error getting user history', e);
    res.status(500).json({ "success": false, "error": e });
  };
});

router.get('/user/totalpoints', async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }});
    const totalPoints = await user.totalPoints();
    res.status(200).json({"success": true, "totalPoints": totalPoints });
  }
  catch (e) {
    console.log('Error getting user total points', e);
    res.status(500).json({ "success": false, "error": e });
  };
});
