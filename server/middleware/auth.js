const models = require('../models');
const Promise = require('bluebird');
var cookieParser = require('./cookieParser.js');

module.exports.createSession = (req, res, next) => {
  cookieParser(req, res, function () {
    if (!req.cookies['shortlyid']) {
      models.Sessions.create()
        .then(record => {
          models.Sessions.get({ id: record.insertId })
            .then(insertedRow => {
              let hashValue = insertedRow.hash;
              req.session = {
                hash: hashValue
              };
              res.cookies = { shortlyid: { value: hashValue } };
              next();
            });
        });
    } else {
      let hashValue = req.cookies['shortlyid'].value;
      req.session = {
        hash: hashValue
      };
      res.cookies = { shortlyid: { value: hashValue } };
      next();
    }
  }
  );
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

