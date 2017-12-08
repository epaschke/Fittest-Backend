const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const { User } = require('./models');
const auth = require('./auth');
const bodyParser = require('body-parser');
var testUserBase = [];

var passport = require('passport');
var FacebookStrategy = require('passport-facebook');

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos', 'friends']
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("profile: ", profile);
    var user = {id: profile.id, username: profile.displayName};
    testUserBase.push(user);
    return cb(null, user);
  }
))

passport.serializeUser(function(user, done) {
  done(null, user.username);
});
passport.deserializeUser(function(username, done) {
  done(null, {username: username});
});

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(req, res){
  res.json({success: true, page: "index"});
})
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    // console.log("User Object: " , req.user);
    // console.log("User keys", Object.keys(req.user));
    res.send({success: true, user: req.user});
  }
);

app.use('/', auth);

app.listen(PORT, error => {
error ? console.error(error) : console.log(`==> Listening on port ${PORT}.`);
});
