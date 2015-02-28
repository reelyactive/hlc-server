/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */


var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
//var basicAuth = require('basic-auth-connect');
var cors = require('cors');
var barnowl = require('barnowl');
var barnacles = require('barnacles');
var barterer = require('barterer');
var chickadee = require('chickadee');

var HTTP_PORT = 3001;
var AUTH_USER = "admin";
var AUTH_PASS = "admin";
var USE_CORS = false;
var DEFAULT_MAX_DECODERS = 3;
var DEFAULT_MAX_STALE_MILLISECONDS = 10000;


/**
 * HLCServer Class
 * Serves up hyperlocal context (HLC) for the Internet of Things.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function HLCServer(options) {
  var self = this;
  options = options || {};
  this.httpPort = options.httpPort || HTTP_PORT;
  this.authUser = options.authUser || AUTH_USER;
  this.authPass = options.authPass || AUTH_PASS;
  this.useCors = options.useCors || USE_CORS;
  this.maxDecoders = options.maxDecoders || DEFAULT_MAX_DECODERS;
  this.maxStaleMilliseconds = options.maxStaleMilliseconds ||
                              DEFAULT_MAX_STALE_MILLISECONDS;

  this.middleware = new barnowl( { n: self.maxDecoders, enableMixing: true } );
  this.notifications = new barnacles( { disappearanceMilliseconds:
                                          self.maxStaleMilliseconds } );
  this.api = new barterer( { httpPort: 3006 } ); // TODO: make configurable
  this.associations = new chickadee( { httpPort: 3004 } ); // TODO: make configurable

  this.notifications.bind( { barnowl: self.middleware } );
  this.api.bind( { barnacles: self.notifications,
                   chickadee: self.associations } );

  this.app = express();
  this.app.use(bodyParser.urlencoded({ extended: true }));
  this.app.use(bodyParser.json());
  if(this.useCors) {
    this.app.use(cors());
  }

/*
  this.auth = basicAuth(function(user, pass) {
    return (user === self.authUser && pass === self.authPass);
  });
  this.app.use('/admin', this.auth);
*/

  this.router = express.Router();
  this.router.use(function(req, res, next) {
    // TODO: basic error checking goes here in the middleware
    next();
  });

  // ----- route: /id ------
  this.router.route('/id')

    .post(function(req, res) {
      var identifier = req.body.identifier;
      var url = req.body.url;
      self.associations.createDevice(identifier, url, req,
                                     function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /id/:id ------
  this.router.route('/id/:id')

    .get(function(req, res) {
      var identifiers = [ req.param('id') ];
      self.api.retrieveDevices(identifiers, req, function(response, status) {
        res.status(status).json(response);
      });
    })

    .put(function(req, res) {
      var identifier = req.param('id');
      var url = req.body.url;
      self.associations.replaceDevice(identifier, url, req, function(response, status) {
        res.status(status).json(response);
      });
    })

    .delete(function(req, res) {
      var identifier = req.param('id');
      self.associations.deleteDevice(identifier, req, function(response, status) {
        res.status(status).json(response);
      });
    });


  // ----- route: /at ------
  this.router.route('/at')

    .post(function(req, res) {
      var place = req.body.place;
      var identifiers = req.body.identifiers;
      self.associations.createPlace(place, identifiers, req,
                                    function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /at/:place ------
  this.router.route('/at/:place')

    .get(function(req, res) {
      var place = req.param('place');
      self.api.retrievePlace(place, req, function(response, status) {
        res.status(status).json(response);
      });
    })

    .put(function(req, res) {
      var place = req.param('place');
      var identifiers = req.body.identifiers;
      self.associations.replacePlace(place, identifiers, req, function(response, status) {
        res.status(status).json(response);
      });
    })

    .delete(function(req, res) {
      var place = req.param('place');
      self.associations.deletePlace(place, req, function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /statistics ------
  this.router.route('/statistics')

    .get(function(req, res) {
      self.notifications.getStatistics(req, function(response, status) {
        res.status(status).json(response);
      });
    });

  // ----- route: /associate (LEGACY - deprecated) ------
  this.router.route('/associate')

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
  

  // TODO: password protect
  this.app.use('/admin', express.static(__dirname + '/../web/admin'));

  this.app.use('/', express.static(__dirname + '/../web'));
  this.app.use('/', self.router);

  this.app.listen(this.httpPort, function() {
    console.log("hlc-server is listening on port " + self.httpPort);
  }); 
}


/**
 * Bind the middleware to the given data stream.
 * @param {Object} options The options as a JSON object.
 */
HLCServer.prototype.bind = function(options) {
  var self = this;
  this.middleware.bind(options);
}


/**
 * Add the given notification service.
 * @param {Object} options The options as a JSON object.
 */
HLCServer.prototype.addNotificationService = function(options) {
  var self = this;
  this.notifications.addNotificationService(options);
}


module.exports = HLCServer;
