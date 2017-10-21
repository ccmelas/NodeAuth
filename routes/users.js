var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var multer = require('multer');

var User = require('../models/user');

//Handle File Uploads
var upload = multer({dest: './uploads'});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', {
    'title' : 'Register'
  });
});

router.post('/register', upload.single('avatar'), function(req, res, next) {
  //get form values
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  
  //check for image field
  if(req.file) {
    console.log('uploading file....');
    var avatarOriginalName = req.file.originalname;
    var avatarName = req.file.filename;
    var avatarMime = req.file.mimetype;
    var avatarPath = req.file.path;
    var avatarSize = req.file.size;
  } else {
    //set default avatar
    var avatarName = 'default.png';
    var avatarMime = '';
  }
  
  //form validation
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is invalid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  //check for errors
  var errors = req.validationErrors();
  console.log(errors);
  if(errors) {
    res.render('register', {
      title: 'Register',
      errors: errors,
      name: name,
      email: email,
      username: username,
    });
  } else {
    var newUser = new User({
      name:name,
      username:username,
      email:email,
      password:password,
      avatar: avatarName,
      mimetype: avatarMime
    });

    //create user
    User.createUser(newUser, function(err, user) {
      if(err) throw err;
      // console.log(user);
    });

    //flash success
    req.flash('success', 'You have registered successfully. You may now login');
    res.redirect('/');

  }
  
});

router.get('/login', function(req, res, next) {
  res.render('login', {
    'title' : 'Login'
  });
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.getUserByUsername(username, function(err, user) {
    if(err) throw err;
    if(!user) {
      console.log('Unknown User');
      return done(null, false, {message: 'Unknown User'});
    }

    User.comparePassword(password, user.password, function(err, isMatch) {
      if(err) throw err;
      if(isMatch) {
        return done(null, user);
      } else {
        console.log('Invalid Password');
        return done(null, false, {message: 'Invalid Password'});
      }
    })
  });
}));

router.post('/login', passport.authenticate('local', {
  failureRedirect:'/users/login',
   failureFlash: 'Invalid username or password'}
  ), function(req, res, next) {
    console.log('Authentication successful');
    req.flash('success', 'You are logged in');
    res.redirect('/');
  }
);

router.get('/logout', function(req, res, next) {
  req.logout();
  req.flash('success', 'You have logged out successfully');
  res.redirect('/users/login');
});

module.exports = router;
