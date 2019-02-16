const models = require("../models");
const Promise = require("bluebird");
var cookieParser = require("./cookieParser.js");

module.exports.createSession = (req, res, next) => {
  // No Cookies
  //console.log("Request headers:", req.headers);
  if (!req.cookies || !req.cookies.shortlyid) {
    //console.log("Received request without cookie==============>", req.cookies);
    models.Sessions.create().then(record => {
      models.Sessions.get({ id: record.insertId }).then(session => {
        let hashValue = session.hash;
        req.session = {
          hash: hashValue
        };
        res.cookies = { shortlyid: { value: hashValue } };
        let cookieValue = "shortlyid=" + hashValue;
        res.setHeader("Set-Cookie", [cookieValue]);
        next();
      });
    });
  } else {
    // With Cookies
    let hashValue = req.cookies.shortlyid;
    //console.log('Received request with cookie and Hash==============>', hashValue);
    models.Sessions.get({ hash: hashValue }).then(session => {
      //console.log('Found session for the cookie===========>', session);
      // User ID exists
      if (!session) {
        res.cookies = { shortlyid: {} };
        //res.cookie( 'shortlyid' , { } );
        next();
      } else if (session.userId !== null) {
        models.Users.get({ id: session.userId }).then(user => {
          //console.log('Found User');
          req.session = {
            hash: hashValue,
            userId: session.userId,
            user: {
              id: user.id,
              username: user.username
            }
          };
          res.cookies = { shortlyid: { value: hashValue } };
          //res.cookie( 'shortlyid' , { value: hashValue } );
          next();
        });
      } else {
        // No User ID Exists
        req.session = {
          hash: hashValue
        };
        res.cookies = { shortlyid: { value: hashValue } };
        //res.cookie( 'shortlyid' , { value: hashValue } );
        next();
      }
    });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.updateSession = (req, res, userId, next) => {
  let sessionId = null;
  console.log("Updating session for user:", userId);
  console.log("Request cookies:", req.cookies);
  if (req.cookies && req.cookies.shortlyid) {
    sessionId = req.cookies.shortlyid;
    console.log("Updating session for HASH:", sessionId);
    models.Sessions.update({ hash: sessionId }, { userId: userId }).then(() =>
      next()
    );
  } else {
    next();
  }
};
