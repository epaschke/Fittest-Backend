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
    public: { type: Sequelize.BOOLEAN, allowNull: false },
    img: { type: Sequelize.STRING, allowNull: true }
}, { getterMethods: {
      totalPoints(){
        Activity.sum('points', { where: { userId: this.fbId } }).then(sum => {
            return sum;
        })
      }
  }
});

const Group = sequelize.define('group', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING, allowNull: false },
  ongoing: { type: Sequelize.BOOLEAN, allowNull: false },
  groupImg: { type: Sequelize.STRING, allowNull: true }
});

const Activity = sequelize.define('activity', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING, allowNull: false },
  duration: {type: Sequelize.INTEGER, allowNull: false },
  rigor: {type: Sequelize.STRING, allowNull: false },
  points: { type: Sequelize.INTEGER, allowNull: false } 
});

const Membership = sequelize.define('membership', {
  active: { type: Sequelize.BOOLEAN, allowNull: false },
  role: { type: Sequelize.STRING, allowNull: false }
})

Activity.belongsTo(User, { foreignKey: { allowNull: false }});
User.hasMany(Activity, {foreignKey: { allowNull: true }});
Group.belongsToMany(User, {through: Membership });
User.belongsToMany(Group, {through: Membership });

module.exports = {
    User,
    Group,
    Activity,
    Membership,
    sequelize
};
