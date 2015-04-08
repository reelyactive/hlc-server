/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */


var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var barnowl = require('barnowl');
var barnacles = require('barnacles');
var barterer = require('barterer');
var chickadee = require('chickadee');

var HTTP_PORT = 3001;
var USE_CORS = false;
var DEFAULT_MAX_DECODERS = 3;
var DEFAULT_MAX_STALE_MILLISECONDS = 10000;
var DEFAULT_USERNAME = "admin";
var DEFAULT_PASSWORD = "admin";
var DEFAULT_SECRET = "YoureProbablyGonnaWantToChangeIt";


/**
 * HLCServer Class
 * Serves up hyperlocal context (HLC) for the Internet of Things.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function HLCServer(options) {
  var self = this;
  options = options || {};
  self.httpPort = options.httpPort || HTTP_PORT;
  self.useCors = options.useCors || USE_CORS;
  self.maxDecoders = options.maxDecoders || DEFAULT_MAX_DECODERS;
  self.maxStaleMilliseconds = options.maxStaleMilliseconds ||
                              DEFAULT_MAX_STALE_MILLISECONDS;
  self.password = options.password || DEFAULT_PASSWORD;
  self.secret = options.secret || DEFAULT_SECRET;

  self.middleware = new barnowl( { n: self.maxDecoders, enableMixing: true } );
  self.notifications = new barnacles( { disappearanceMilliseconds:
                                          self.maxStaleMilliseconds } );
  self.api = new barterer( { httpPort: 3006 } ); // TODO: make configurable
  self.associations = new chickadee( { httpPort: 3004 } ); // TODO: make configurable

  self.notifications.bind( { barnowl: self.middleware } );
  self.api.bind( { barnacles: self.notifications,
                   chickadee: self.associations } );

  self.app = express();
  self.app.use(bodyParser.urlencoded({ extended: true }));
  self.app.use(bodyParser.json());
  self.app.use(session( { secret: self.secret, resave: false,
                          saveUninitialized: false } ));
  self.app.use(passport.initialize());
  self.app.use(passport.session());
  if(self.useCors) {
    self.app.use(cors());
  }

  self.router = express.Router();
  self.router.use(function(req, res, next) {
    // TODO: basic error checking goes here in the middleware
    next();
  });

  // ----- route: /id ------
  self.router.route('/id')

    .get(function(req, res) {
      if(Object.keys(req.query).length === 0) {
        res.status(501).send('Not Implemented'); // TODO: handle elegantly
      }
      else {
        var parameters = { value: req.query.value };
        self.associations.retrieveDevice(null, parameters, req,
                                         function(response, status) {
          res.status(status).json(response);
        });
      }
    })

    .post(function(req, res) {
      var identifier = req.body.identifier;
      var url = req.body.url;
      self.associations.createDevice(identifier, url, req,
                                     function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /id/:id ------
  self.router.route('/id/:id')

    .get(function(req, res) {
      var identifiers = [ req.param('id') ];
      self.api.retrieveDevices(identifiers, req, function(response, status) {
        res.status(status).json(response);
      });
    })

    .put(function(req, res) {
      var id = req.param('id');
      var identifier = req.body.identifier;
      var url = req.body.url;
      self.associations.replaceDevice(id, identifier, url, req, function(response, status) {
        res.status(status).json(response);
      });
    })

    .delete(apiAuthentication, function(req, res) {
      var identifier = req.param('id');
      self.associations.deleteDevice(identifier, req, function(response, status) {
        res.status(status).json(response);
      });
    });


  // ----- route: /at ------
  self.router.route('/at')

    .post(apiAuthentication, function(req, res) {
      var place = req.body.place;
      var identifiers = req.body.identifiers;
      self.associations.createPlace(place, identifiers, req,
                                    function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /at/:place ------
  self.router.route('/at/:place')

    .get(function(req, res) {
      var place = req.param('place');
      self.api.retrievePlace(place, req, function(response, status) {
        res.status(status).json(response);
      });
    })

    .put(apiAuthentication, function(req, res) {
      var place = req.param('place');
      var identifiers = req.body.identifiers;
      self.associations.replacePlace(place, identifiers, req, function(response, status) {
        res.status(status).json(response);
      });
    })

    .delete(apiAuthentication, function(req, res) {
      var place = req.param('place');
      self.associations.deletePlace(place, req, function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /event ------
  self.router.route('/event')

    .post(function(req, res) {
      var event = req.body.event;
      var tiraid = req.body.tiraid;
      self.notifications.updateState(event, tiraid, function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /statistics ------
  self.router.route('/statistics')

    .get(function(req, res) {
      self.notifications.getStatistics(req, function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /associate (LEGACY - deprecated) ------
  self.router.route('/associate')

    .post(function(req, res) {
      if(req.body.action == "Add ID") {
        var identifier = req.body.identifier;
        var url = req.body.url;
        self.associations.createDevice(identifier, url, req,
                                       function(response, status) {
          res.redirect('/associated.html?url=' + req.protocol + '://'
                       + req.get('host') + '/id/' + identifier);
        });
      }
    });

  // ----- route: /login ------
  self.router.route('/login')

    .post(passport.authenticate('local', { failureRedirect: '/login.html',
                                           successRedirect: '/admin/' })
    );

  passport.serializeUser(function(user, done) { done(null, user); });
  passport.deserializeUser(function(user, done) { done(null, user); });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      if (password === self.password)
        return done(null, { username: DEFAULT_USERNAME });
      else
        return done(null, false);
    }
  ));  

  self.app.use('/admin', webAuthentication);
  self.app.use('/admin', express.static(__dirname + '/../web/admin'));

  self.app.use('/', express.static(__dirname + '/../web'));
  self.app.use('/', self.router);

  self.app.listen(self.httpPort, function() {
    console.log("hlc-server is listening on port " + self.httpPort);
  }); 
}


/**
 * Check if a user is authenticated, if not redirect to login.
 */
function webAuthentication(req, res, next) {
  if(req.isAuthenticated()) {
    next();
  }
  else {
    var rootUrl = req.protocol + '://' + req.get('host');
    res.redirect(rootUrl + '/login.html');
  }
}

/**
 * Check if a user is authenticated, if not respond with 401.
 */
function apiAuthentication(req, res, next) {
  if(req.isAuthenticated()) {
    next();
  }
  else {
    // TODO: put this in a response handler
    res.status(401).json({ _meta: { message: "not authorized",
                                    statusCode: 401 } });
  }
}


/**
 * Bind the middleware to the given data stream.
 * @param {Object} options The options as a JSON object.
 */
HLCServer.prototype.bind = function(options) {
  var self = this;
  self.middleware.bind(options);
}


/**
 * Add the given notification service.
 * @param {Object} options The options as a JSON object.
 */
HLCServer.prototype.addNotificationService = function(options) {
  var self = this;
  self.notifications.addService(options);
}


module.exports = HLCServer;
