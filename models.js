"use strict";

var Sequelize = require('sequelize');

var sequelize = new Sequelize(process.env.DATABASE_NAME, 'postgres', process.env.DATABASE_PASSWORD, {
    dialect: 'postgres'
});

sequelize
.authenticate()
.then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});

const User = sequelize.define('user', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    fbId: { type: Sequelize.STRING, allowNull: false, unique: true },
    username: { type: Sequelize.STRING, allowNull: false, unique: false },
    public: { type: Sequelize.BOOLEAN, allowNull: false },
    img: { type: Sequelize.STRING, allowNull: true }
  });

const Group = sequelize.define('group', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING, allowNull: false },
  description: { type: Sequelize.STRING(1234), allowNull: true },
  groupImg: { type: Sequelize.STRING, allowNull: true },
  public: { type: Sequelize.BOOLEAN, allowNull: false },
  mission: { type: Sequelize.STRING, allowNull: true },
  startDate: { type: Sequelize.DATEONLY, allowNull: false }
});

const Tourney = sequelize.define('tourney', {
  startDate: { type: Sequelize.DATEONLY, allowNull: false },
  endDate: { type: Sequelize.DATEONLY, allowNull: false }
});

const Activity = sequelize.define('activity', {
  name: { type: Sequelize.STRING, allowNull: false },
  duration: {type: Sequelize.INTEGER, allowNull: false },
  rigor: {type: Sequelize.STRING, allowNull: false },
  points: { type: Sequelize.INTEGER, allowNull: false }
});

const Membership = sequelize.define('membership', {
  active: { type: Sequelize.BOOLEAN, allowNull: false },
  role: { type: Sequelize.STRING, allowNull: false }
});

const Trophy = sequelize.define('trophy', {
  date: { type: Sequelize.DATE, allowNull: false },
  points: { type: Sequelize.INTEGER, allowNull: false }
});

Activity.belongsTo(User, { foreignKey: { allowNull: false }});
Trophy.belongsTo(User, { foreignKey: { allowNull: false }});
Trophy.belongsTo(Tourney, { foreignKey: { allowNull: false }});
Tourney.hasOne(Trophy);
User.hasMany(Activity, { foreignKey: { allowNull: true }});
Group.belongsToMany(User, { through: Membership });
User.belongsToMany(Group, { through: Membership });
Group.hasMany(Tourney, { foreignKey: { allowNull: false }});
Tourney.belongsTo(Group, {foreignKey: { allowNull: false }});

// Make SequelizeStore create/sync a table "Sessions" in DB
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sessionStore = new SequelizeStore({
  db: sequelize
});

module.exports = {
    User,
    Group,
    Activity,
    Membership,
    Trophy,
    Tourney,
    sequelize,
    session,
    sessionStore
};
