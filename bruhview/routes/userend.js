const express = require('express');
const _ = require('lodash');
const session = require('express-session');
const expressValidator = require('express-validator');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt= require('bcryptjs');
const path = require('path');
const flash = require('connect-flash');
const exphbs = require('express-handlebars');
const uuidv4 = require('uuid/v4');
var passport = require("passport");
var request = require("request");
const mysql = require('mysql');
const moment = require('moment');
let dbInfo = {
  host: "localhost",
  user: "root",
  password: "cs252project!",
  database : 'BruhView'
};

const LocalStrategy = require('passport-local').Strategy;
const AuthenticationFunctions = require('../Authentication.js');


router.get('/dashboard', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
    return res.render('platform/dashboard.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});


router.get('/login',AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
    return res.render('platform/login.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.post('/login', AuthenticationFunctions.ensureNotAuthenticated, passport.authenticate('local', { successRedirect: '/dashboard', failureRedirect: '/login', failureFlash: true }), (req, res) => {
  res.redirect('/dashboard');
});

/*
router.post('/login',(req,res) => {
      let username = req.body.username;
      let password = req.body.password;
      req.checkBody('username', 'Username field is required.').notEmpty();
      req.checkBody('password', 'Password field is required.').notEmpty();
      let formErrors = req.validationErrors();
        if (formErrors) {
            req.flash('error', formErrors[0].msg);
            return res.redirect('/login');
        }
        let con = mysql.createConnection(dbInfo);
        con.query(`SELECT * FROM users WHERE username=${mysql.escape(req.body.username)} AND password=${mysql.escape(req.body.password)};`, (error, results, fields) => {
          if (error) {
            console.log(error.stack);
            con.end();
            return res.send();
          }
            if(results.length == 0){
              con.end();
              req.flash('success', 'Username or Password are incorrect');
              return res.redirect('/login');
            } // user not found
            con.end();
            req.flash('success', 'Successfully Logged In');
            return res.redirect('/dashboard');
        });
});
*/
passport.use(new LocalStrategy({passReqToCallback: true,},
	function (req, username, password, done) {
      let con = mysql.createConnection(dbInfo);
      con.query(`SELECT * FROM users WHERE username=${mysql.escape(username)};`, (error, results, fields) => {
        if (error) {
          console.log(error.stack);
          con.end();
          return;
        }
        if (results.length === 0) {
          con.end();
          return done(null, false, req.flash('error', 'Username or Password is incorrect.'));
        } else {
            if (bcrypt.compareSync(password, results[0].password)) {
              console.log(`${username} successfully logged in.`);
              let user = {
                  identifier: results[0].id,
                  username: results[0].username,
                  firstName: results[0].firstname,
                  lastName: results[0].lastname,
              };
              con.end();
              return done(null, user);
            } else {
              con.end();
              return done(null, false, req.flash('error', 'Username or Password is incorrect.'));
            }

        }
      });

}));



router.get('/register', AuthenticationFunctions.ensureNotAuthenticated,(req, res) => {
    return res.render('platform/register.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.get('/register', AuthenticationFunctions.ensureAuthenticated,(req, res) => {
    return res.render('platform/registeradmin.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.post('/register',AuthenticationFunctions.ensureNotAuthenticated,(req,res)=>{
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let username = req.body.username;
  let password = req.body.password;

    req.checkBody('firstname', 'First Name field is required.').notEmpty();
    req.checkBody('lastname', 'Last Name field is required.').notEmpty();
    req.checkBody('username', 'Username field is required.').notEmpty();
    req.checkBody('password', 'New Password field is required.').notEmpty();
    req.checkBody('repassword', 'Confirm New password field is required.').notEmpty();
	  req.checkBody('repassword', 'New password does not match confirmation password field.').equals(req.body.password);

    let formErrors = req.validationErrors();
      if (formErrors) {
  		    req.flash('error', formErrors[0].msg);
          return res.redirect('/register');
  	  }

      let con = mysql.createConnection(dbInfo);
      con.query(`SELECT * FROM users WHERE username=${mysql.escape(req.body.username)};`, (error, results, fields) => { //checks to see if username is already taken
          if (error) {
            console.log(error.stack);
            con.end();
            return res.send();
          }

          if(results.length == 0){
          let userid = uuidv4();
          let salt = bcrypt.genSaltSync(10);
          let hashedPassword = bcrypt.hashSync(req.body.password,salt);
          con.query(`INSERT INTO users (id,username, password, firstname, lastname) VALUES (${mysql.escape(userid)}, ${mysql.escape(username)}, '${hashedPassword}', ${mysql.escape(req.body.firstname)}, ${mysql.escape(req.body.lastname)});`, (error, results, fields) => {
            if (error) {
            console.log(error.stack);
            con.end();
            return;
          }
          if (results) {
            console.log(`${req.body.email} successfully registered.`);
            con.end();
            req.flash('success', 'Successfully registered. You may now login.');
            return res.redirect('/login');
          }
          else {
            con.end();
            req.flash('error', 'Something Went Wrong. Try Registering Again.');
            return res.redirect('/register');
          }


      });
    }
    else{
      con.end();
      req.flash('error', 'Username is already taken');
      return res.redirect('/register');

    }


    }); //initial query


});

router.post('/registeradmin',AuthenticationFunctions.ensureAuthenticated,(req,res)=>{
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let username = req.body.username;
  let password = req.body.password;

    req.checkBody('firstname', 'First Name field is required.').notEmpty();
    req.checkBody('lastname', 'Last Name field is required.').notEmpty();
    req.checkBody('username', 'Username field is required.').notEmpty();
    req.checkBody('password', 'New Password field is required.').notEmpty();
    req.checkBody('repassword', 'Confirm New password field is required.').notEmpty();
	  req.checkBody('repassword', 'New password does not match confirmation password field.').equals(req.body.password);

    let formErrors = req.validationErrors();
      if (formErrors) {
  		    req.flash('error', formErrors[0].msg);
          return res.redirect('/registeradmin');
  	  }

      let con = mysql.createConnection(dbInfo);
      con.query(`SELECT * FROM users WHERE username=${mysql.escape(req.body.username)};`, (error, results, fields) => { //checks to see if username is already taken
          if (error) {
            console.log(error.stack);
            con.end();
            return res.send();
          }

          if(results.length == 0){
          let userid = uuidv4();
          let salt = bcrypt.genSaltSync(10);
          let hashedPassword = bcrypt.hashSync(req.body.password,salt);
          con.query(`INSERT INTO users (id,username, password, firstname, lastname,admin) VALUES (${mysql.escape(userid)}, ${mysql.escape(username)}, '${hashedPassword}', ${mysql.escape(req.body.firstname)}, ${mysql.escape(req.body.lastname)},${mysql.escape('1')});`, (error, results, fields) => {
            if (error) {
            console.log(error.stack);
            con.end();
            return;
          }
          if (results) {
            console.log(`${req.body.email} successfully registered.`);
            con.end();
            req.flash('success', 'Successfully registered Admin Account. You may now login.');
            return res.redirect('/login');
          }
          else {
            con.end();
            req.flash('error', 'Something Went Wrong. Try Registering Again.');
            return res.redirect('/registeradmin');
          }


      });
    }
    else{
      con.end();
      req.flash('error', 'Username is already taken');
      return res.redirect('/registeradmin');

    }
    }); //initial query
});








router.get('/logout', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.logout();
  req.session.destroy();
  return res.redirect('/login');
});

passport.serializeUser(function (uuid, done) {
	done(null, uuid);
});

passport.deserializeUser(function (uuid, done) {
  done(null, uuid);
});


module.exports = router;
