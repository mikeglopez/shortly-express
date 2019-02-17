const models = require("../models");
const Promise = require("bluebird");
var cookieParser = require("./cookieParser.js");

module.exports.createSession = (req, res, next) => {
  // console.log("Starting new Session with req======>", req.headers);
  // No Cookies
  if (!req.cookies || !req.cookies.shortlyid) {
    // console.log("=========No Cookie======. Creating New session for Req:", req.headers);
    models.Sessions.create().then(record => {
      models.Sessions.get({ id: record.insertId }).then(session => {

        let hashValue = session.hash;

        // console.log("=========Added session ======. HashValue:", hashValue);
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
    // console.log("=========Got Cookies======. Setting User for Req:", req.headers);

    let hashValue = req.cookies.shortlyid;
    // console.log("=========Got Cookies======. Cookie:", hashValue);
    models.Sessions.get({ hash: hashValue }).then(session => {
      // User ID exists
      if (!session) {
        res.cookies = { shortlyid: {} };
        next();
      } else if (session.userId !== null) {
        models.Users.get({ id: session.userId }).then(user => {
          req.session = {
            hash: hashValue,
            userId: session.userId,
            user: {
              id: user.id,
              username: user.username
            }
          };
          res.cookies = { shortlyid: { value: hashValue } };
          next();
        });
      } else {
        // No User ID Exists
        req.session = {
          hash: hashValue
        };
        res.cookies = { shortlyid: { value: hashValue } };
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
  if (req.session) {
    sessionId = req.session.hash;
    models.Sessions.update({ hash: sessionId }, { userId: userId }).then(() =>
      next()
    );
  } else {
    next();
  }
};

module.exports.deleteSession = (req, res, next) => {
  let cookieValue = "shortlyid=''" ;
  res.setHeader("Set-Cookie", [cookieValue]);
  if (req.session) {
    sessionId = req.session.hash;
    models.Sessions.delete({ hash: sessionId }).then(() =>
      next()
    );
  } else {
    next();
  }
};
