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
/*
  host: "localhost",
  user: "root",
  password: "cs252project!",
  database : 'BruhView'
*/

  connectionLimit: 100,
   host:'134.209.4.10',
   user:'root',
   password:'cs252project!',
   database:'BruhView',
   port: 3306,
   multipleStatements: true
};

const LocalStrategy = require('passport-local').Strategy;
const AuthenticationFunctions = require('../Authentication.js');

/*
router.get('/dashboard', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
    return res.render('platform/dashboard.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});
*/

router.get('/',AuthenticationFunctions.ensureAuthenticated,(req, res) => {
    return res.render('platform/dashboard.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.get('/dashboard',AuthenticationFunctions.ensureAuthenticated,(req, res) => {
    return res.render('platform/dashboard.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.get('/movie/:id',AuthenticationFunctions.ensureAuthenticated,(req, res) => {
    console.log(`${req.params.id}`);

    let con = mysql.createConnection(dbInfo);
    con.query(`SELECT * FROM movies WHERE imdbID=${mysql.escape(req.params.id)};`, (error, results, fields) => {
      if (error) {
          console.log(error.stack);
          con.end();
          return;
      }

      if (results.length === 0) {
        req.flash('error', 'Movie ID has not been added to database yet');
        return res.redirect(`/dashboard`);
      }

      return res.render('platform/movie.hbs', {
      title: results[0].title,
      genre:results[0].genre,
      year:results[0].year,
      director:results[0].director,
      picture: results[0].pic,
      error: req.flash('error'),
      success: req.flash('success'),
    });



    });
});


router.get('/reviews',AuthenticationFunctions.ensureAuthenticated,(req, res) => {
  return res.render('platform/reviews.hbs', {
  error: req.flash('error'),
  success: req.flash('success'),
});
});


router.post('/dashboard', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
    //ROUTER POST
    let searchTitle = req.body.searchTitle;

    // Search movie requested by user
    var start = "http://www.omdbapi.com/?t=";
    var key = "&apikey=f0e99e3";
    var apiSearchWithKey = start.concat(searchTitle, key);
    console.log(apiSearchWithKey);

    const request = require('request');

    var obj;
    var title;
    var year;
    var genre;
    var director;
    var imdbID;
    var pic = "none";

    request(apiSearchWithKey, function (error, response, body) {
        // Parse info
        obj = JSON.parse(body);
        title = obj.Title;
        year = obj.Year;
        genre = obj.Genre;
        director = obj.Director;
        imdbID = obj.imdbID;
        pic = obj.Poster;

        if(typeof imdbID == "undefined") {
            console.log("IMDB API failed to find a movie with this title");
            req.flash('error', 'IMDB API failed to find a movie with this title"');
            return res.redirect('/dashboard');
        }

        // Add API results to database
        let con = mysql.createConnection(dbInfo);
        // Check if movie already exists in database
        con.query(`SELECT * FROM movies WHERE imdbID=${mysql.escape(imdbID)};`, (error, results, fields) => {
            if (error) {
                console.log(error.stack);
                con.end();
                return;
            }

            if (results.length === 0) {
                // Make new movie
                console.log('Movie does not already exist in database');
                console.log(`${pic}`);
                con.query(`INSERT INTO movies (imdbID, title, year, genre, director,pic) VALUES (${mysql.escape(imdbID)}, ${mysql.escape(title)}, '${year}', ${mysql.escape(genre)}, ${mysql.escape(director)},${mysql.escape(pic)});`, (error, results, fields) => {

                    if (error) {
                        console.log(error.stack);
                        con.end();
                        return;
                    }

                    console.log(`${title} successfully added movie to database.`);
                    con.end();
                    return res.redirect(`/movie/${imdbID}`);
                    req.flash('success', 'sucessfully added to database');
                    //return res.redirect('/searchresult');
                });
            }
            else {
                return res.redirect(`/movie/${imdbID}`);
            }
        });

    });
});


router.get('/login',AuthenticationFunctions.ensureNotAuthenticated, (req, res) => {
    return res.render('platform/login.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

router.get('/searchresult', (req, res) => {

    return res.render('platform/searchresult.hbs', {
        error: req.flash('error'),
        success: req.flash('success'),
    });
});

router.post('/searchresult', (req, res) => {
    let memoinput = req.body.memoInput;

    return res.render('platform/searchresult.hbs', {
        error: req.flash('error'),
        success: req.flash('success'),
    });
});

router.post('/login', AuthenticationFunctions.ensureNotAuthenticated, passport.authenticate('local', { successRedirect: '/dashboard', failureRedirect: '/login', failureFlash: true }), (req, res) => {
  res.redirect('/dashboard');
});

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

passport.serializeUser(function (uuid, done) {
	done(null, uuid);
});

passport.deserializeUser(function (uuid, done) {
  done(null, uuid);
});

router.get('/settings', AuthenticationFunctions.ensureAuthenticated,(req, res) => {
  let con = mysql.createConnection(dbInfo);

    con.query(`SELECT * FROM users WHERE id=${mysql.escape(req.user.identifier)};`, (error, user, fields) => {
      if (error) {
          console.log(error.stack);
          con.end();
          return res.send();
      }
      con.end();
      console.log(user)
      return res.render('platform/settings.hbs', {
        username: user[0].username,
        firstName: user[0].firstname,
        lastName: user[0].lastname
      });
    });
});

router.get('/register', AuthenticationFunctions.ensureNotAuthenticated,(req, res) => {
    return res.render('platform/register.hbs', {
    error: req.flash('error'),
    success: req.flash('success'),
  });
});


router.get('/sampleinput', AuthenticationFunctions.ensureAuthenticated,(req, res) => {
  let con = mysql.createConnection(dbInfo);

    con.query(`SELECT * FROM users WHERE id=${mysql.escape(req.user.identifier)};`, (error, user, fields) => {
      if (error) {
          console.log(error.stack);
          con.end();
          return res.send();
      }
      con.end();
      return res.render('platform/sampleinput.hbs', {
        testin: user[0].testInput,
      });
    });
});

router.post('/sampleinput', AuthenticationFunctions.ensureAuthenticated,(req, res) => {
  let con = mysql.createConnection(dbInfo);

  let t = req.body.testInput;
  con.query(`UPDATE users SET testInput = ${mysql.escape(t)} WHERE users.id = ${mysql.escape(req.user.identifier)};`, (error, results, fields) => {
  if (error) {
      console.log(error.stack);
      con.end();
      return res.send();
  }
  con.end();
  req.flash('success', 'test input successfully updated!!');
  return res.redirect('/sampleinput');
  });


});


router.get('/registeradmin', AuthenticationFunctions.ensureAuthenticated,(req, res) => {
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
      con.query(`SELECT * FROM users WHERE id=${mysql.escape(req.user.identifier)};`,(error,results,fields) =>{
        if (error) {
          console.log(error.stack);
          con.end();
          return res.send();
        }
   if(results[0].admin != '1'){
          con.end();
          req.flash('error', 'Only Admin Accounts can add Admin Accounts.');
          return res.redirect('/dashboard');
        }
    else{
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
            req.flash('success', 'Successfully registered Admin Account.');
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
}
        });
});


router.get('/logout', AuthenticationFunctions.ensureAuthenticated, (req, res) => {
  req.logout();
  req.session.destroy();
  return res.redirect('/login');
});


module.exports = router;
