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


router.get('/dashboard', (req, res) => {
    return res.render('platform/dashboard.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});


router.get('/login', (req, res) => {
    return res.render('platform/login.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.get('/register', (req, res) => {
    return res.render('platform/register.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.post('/register',(req,res)=>{
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
          con.query(`INSERT INTO users (id,username, password, firstname, lastname) VALUES (${mysql.escape(userid)}, ${mysql.escape(username)}, ${mysql.escape(req.body.password)}, ${mysql.escape(req.body.firstname)}, ${mysql.escape(req.body.lastname)});`, (error, results, fields) => {
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


module.exports = router;
