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
    username: { type: Sequelize.STRING, allowNull: false, unique: true },
    password: { type: Sequelize.STRING, allowNull: false },
    public: { type: Sequelize.BOOLEAN, allowNull: false }
});

// const Group = sequelize.define('group', {
//   id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
//   name: { type: Sequelize.STRING, allowNull: false },
//   active: { type: Sequelize.BOOLEAN, allowNull: false }
// });
//
// const Activity = sequelize.define('activity', {
//   id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
//   name: { type: Sequelize.STRING, allowNull: false },
//   duration: {type: Sequelize.INTEGER, allowNull: false },
//   rigor: {type: Sequelize.STRING, allowNull: false }
// }, getterMethods: {
//   points() {
//     switch(this.rigor){
//       case 'casual':
//         return this.duration * 10;
//       case 'moderate':
//         return this.duration * 30;
//       default:
//         return this.duration * 50;
//     }
//   }
// })

// Group.belongsTo(User, { foreignKey: { allowNull: false }});
// Activity.belongsTo(User, { foreignKey: { allowNull: false }});
// User.hasMany(Group, { foreignKey: { allowNull: true }});
// User.hasMany(Activity, {foreignKey: { allowNull: true }});

module.exports = {
    User,
    // Group,
    // Activity,
    sequelize
};
