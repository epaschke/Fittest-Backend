const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// import database connections & express-session instance
const { session } = require('./models');
const { sessionStore } = require('./models');

// import models
const { User } = require('./models');

// import routes from auth and routes
const auth = require('./auth');
const routes = require('./routes');

// import dependencies
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');

// Tell express-session to use postgres to store sessions
app.use(session({
  secret: process.env.SECRET,
  store: sessionStore,
  resave: false,
  proxy: true
}));

// Define passport's local strategy; how will user data be retrieved?
passport.use(new LocalStrategy(
  function(fbId, name, done) {
    User.findOne({where: {fbId: fbId}})
    .then(user => {
      if (user) {
        return done(null, user.dataValues);
      } else {
        return done({error: "User could not be found."}, null);
      }
    })
    .catch(err => {
      return done(err, null);
    });
  }
))

passport.serializeUser(function(user, done) {
  done(null, user.fbId);
});
passport.deserializeUser(function(id, done) {
  User.findOne({where: {fbId: id}})
  .then(user => {
    if (user) {
      return done(null, user.dataValues);
    } else {
      return done({error: "User could not be found."}, null);
    }
  })
});

app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(req, res){
  res.json({success: true, page: "index"});
})

app.use('/', auth(passport));
app.use('/', routes)

app.get('/test', function(req, res) {
  res.json({success: true, page: "test", user: req.user});
})

app.listen(PORT, error => {
error ? console.error(error) : console.log(`==> Listening on port ${PORT}.`);
});
