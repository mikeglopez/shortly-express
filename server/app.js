const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser.js');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

var logger = function (req, res, next) {
  console.log('GOT REQUEST !', req.url, ' and ', req.method);
  next(); // Passing the request to the next handler in the stack.
};
app.use(logger);

app.use(cookieParser);
app.use(Auth.createSession);

app.get('/login', (req, res, next) => {
  res.render('login');
});

app.get('/signup', (req, res, next) => {
  res.render('signup');
});

app.get('/', (req, res) => {
  if (!models.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login');
  } else { // they are logged in
    res.render('index');
  }

});

app.get('/create', (req, res) => {
  if (!models.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login');
  } else { // they are logged in
    res.render('index');
  }
});

app.get('/links', (req, res, next) => {
  if (!models.Sessions.isLoggedIn(req.session)) {
    res.redirect('/login');
  } else {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  }
});

app.post('/links', (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  models.Users.get({ username }).then(result => {
    if (result === undefined) {
      models.Users.create({ username, password }).then(record => {
        Auth.updateSession(req, res, record.insertId, function () {
          res.redirect('/');
        });
      });
    } else {
      res.redirect('/signup');
    }
  });
});

app.post('/login', (req, res, next) => {
  var username = req.body.username;
  var attempted = req.body.password;
  models.Users.get({ username }).then(result => {
    if (result === undefined) {
      res.redirect('/login');
    } else {
      var found = models.Users.compare(attempted, result.password, result.salt);
      if (found) {
        Auth.updateSession(req, res, result.id, function () {
          res.redirect('/');
        });
      } else {
        res.redirect('/login');
      }
    }
  });
});

app.get('/logout',
  (req, res) => {
    Auth.deleteSession(req, res, function () {
      res.redirect('/login');
    });
  });

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {
  return models.Links.get({ code: req.params.code })
    .tap(link => {
      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
