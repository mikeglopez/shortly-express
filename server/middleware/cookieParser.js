const parseCookies = (req, res, next) => {
  req.cookies={};
  var cookies =req.headers.cookie;
  if (cookies) {
    var cookiesArray = cookies.split(';');
    for (let i = 0; i < cookiesArray.length; i++) {
      var eachCookie=cookiesArray[i].split("=");
      var key = eachCookie[0].trim();
      var value = eachCookie[1].trim();
      req.cookies[key]=value;
    }
  }
  next();
};

module.exports = parseCookies;