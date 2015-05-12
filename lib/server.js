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
var path = require('path');
var barnowl = require('barnowl');
var barnacles = require('barnacles');
var barterer = require('barterer');
var chickadee = require('chickadee');
var responseHandler = require('./responsehandler');

var Barnacles = barnacles.Barnacles;
var Barterer = barterer.Barterer;
var Chickadee = chickadee.Chickadee;

var HTTP_PORT = 3001;
var USE_CORS = false;
var DEFAULT_MAX_RADIO_DECODERS = 3;
var DEFAULT_ENABLE_MIXING = true;
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
  
  parseOptions(self, options);

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

  // barnowl
  self.middleware = new barnowl(options.barnowl);

  // barnacles
  self.notifications = new Barnacles(options.barnacles);
  self.notifications.bind( { barnowl: self.middleware } );
  self.notifications.configureRoutes( { app: self.app } );

  // barterer
  self.api = new Barterer(options.barterer);
  self.api.bind( { barnacles: self.notifications } );
  self.api.configureRoutes( { app: self.app } );

  // chickadee
  self.associations = new Chickadee(options.chickadee);
  self.associations.bind( { barnacles: self.notifications } );
  self.associations.configureRoutes( { app: self.app } );

  // Legacy routes (remove when appropriate)
  self.app.use('/at', require('./routes/at'));
  self.app.use('/id', require('./routes/id'));

  self.router = express.Router();

  // ----- route: /login ------ TODO: move with authentication to separate file
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
  self.app.use('/admin',
               express.static(path.resolve(__dirname + '/../web/admin')));

  self.app.use('/', express.static(path.resolve(__dirname + '/../web')));
  self.app.use('/', self.router);

  self.app.listen(self.httpPort, function() {
    console.log("hlc-server is listening on port " + self.httpPort);
  }); 
}


/**
 * Check if a user is authenticated, if not redirect to login.
 */
function webAuthentication(req, res, next) { // TODO: move with authentication to separate file
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
function apiAuthentication(req, res, next) { // TODO: move with authentication to separate file
  if(req.isAuthenticated()) {
    next();
  }
  else {
    var rootUrl = req.protocol + '://' + req.get('host');
    var queryPath = req.originalUrl;
    var status = responseHandler.UNAUTHORIZED;
    var response = responseHandler.prepareResponse(status, rootUrl, queryPath);
    res.status(status).json(response);
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


/**
 * Parse the instantiation options.
 * @param {HLCServer} instance The given hlc-server instance.
 * @param {Object} options The options as a JSON object.
 */
function parseOptions(instance, options) {
  options = options || {};

  instance.httpPort = options.httpPort || HTTP_PORT;
  instance.useCors = options.useCors || USE_CORS;
  instance.password = options.password || DEFAULT_PASSWORD;
  instance.secret = options.secret || DEFAULT_SECRET;

  options.barnowl = options.barnowl || {};
  options.barnowl.n = options.barnowl.n || DEFAULT_MAX_RADIO_DECODERS;
  options.barnowl.enableMixing = options.barnowl.enableMixing ||
                                 DEFAULT_ENABLE_MIXING;

  options.barnacles = options.barnacles || {};
  options.barterer = options.barterer || {};
  options.chickadee = options.chickadee || {};
}


module.exports = HLCServer;
module.exports.apiAuthentication = apiAuthentication; // TODO: move with authentication to separate file
