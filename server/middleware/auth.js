const models = require('../models');
const Promise = require('bluebird');
var cookieParser = require('./cookieParser.js');

module.exports.createSession = (req, res, next) => {
  req.session={
    hash: true
  };
  res.cookies={shortlyid: {value:'18ea4fb6ab3178092ce936c591ddbb90c99c9f66'}};
  //cookieParser(req,res,next);
  next();
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

