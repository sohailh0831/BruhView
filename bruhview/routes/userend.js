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
    console.log("here");
});


module.exports = router;
