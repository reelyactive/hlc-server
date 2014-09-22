var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth-connect');
var cors = require('cors');
var contextManager = require('./contextmanager');
var placeManager = require('./placemanager');
var associationManager = require('./associationmanager');
var responseHandler = require('./responsehandler');

var HTTP_PORT = 3001;
var AUTH_USER = "admin";
var AUTH_PASS = "admin";


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

  this.app = express();
  this.context = new contextManager();
  this.places = new placeManager();
  this.associations = new associationManager();
  this.auth = basicAuth(function(user, pass) {
    return (user === self.authUser && pass === self.authPass);
  });

  this.app.use(cors());
  this.app.use(bodyParser.urlencoded({ extended: false }));

  this.app.use('/', express.static(__dirname + '/../web'));

  this.app.get('/id/:id', function(req, res) {
    searchByIDs(self, getRequestParameters(req), function(result) {
      res.json(result);
    });
  });

  this.app.get('/at/:place', function(req, res) {
    searchByPlace(self, getRequestParameters(req), function(result) {
      res.json(result);
    });
  });

  this.app.use('/admin', this.auth);

  this.app.use('/admin', express.static(__dirname + '/../web/admin'));

  this.app.post('/admin', function(req, res) {
    var post = req.body;
    handlePost(self, post, function(result) {
      res.redirect('/admin');
    });
  });

  this.app.listen(this.httpPort);
  console.log("hlc-server is listening on port " + this.httpPort);
}


/**
 * Search hyperlocal context based on identifiers.
 * @param {HLCServer} instance The given HLCServer instance.
 * @param {Object} params The parameters to search on.
 * @param {function} callback Function to call on completion.
 */
function searchByIDs(instance, params, callback) {
  // TODO: check if ids are well formed, if not badRequest
  instance.context.findNearby(params, function(nearby, params) {
    var foundNothing = !Object.keys(nearby).length;
    if(foundNothing) {
      callback(responseHandler.prepareFailureResponse("notFound"));
      return;
    }
    instance.associations.link(nearby, params, function(linked, params) {
      callback(responseHandler.prepareResponse(linked, params));
    });
  });
}


/**
 * Search hyperlocal context based on a place.
 * @param {HLCServer} instance The given HLCServer instance.
 * @param {Object} params The parameters to search on.
 * @param {function} callback Function to call on completion.
 */
function searchByPlace(instance, params, callback) {
  instance.places.getIDs(params, function(params) {
    if(params.ids) {
      searchByIDs(instance, params, callback);
    }
    else {
      callback(responseHandler.prepareFailureResponse("notFound"));
    }
  });
}


/**
 * Return the API request parameters as an object.
 * @param {Object} req The request.
 */
function getRequestParameters(req) {
  var params = {};
  params.ids = [ req.param('id') ];
  params.place = req.param('place');
  params.rootUrl = req.protocol + '://' + req.get('host');
  params.queryPath = req.originalUrl;
  return params;
}


/**
 * Handle admin POST action.
 * @param {HLCServer} instance The given HLCServer instance.
 * @param {Object} post The post data.
 * @param {function} callback Function to call on completion.
 */
function handlePost(instance, post, callback) {
  switch(post.action) {
    case("Add ID"):
      instance.associations.add(post.identifier, post.url);
      break;
    case("Remove ID"):
      instance.associations.remove(post.identifier);
      break;
    case("Add Place"):
      instance.places.add(post.place, post.ids);
      break;
    case("Remove Place"):
      instance.places.remove(post.place);
      break;
    default:
      console.log("Unhandled POST action: " + post.action);
  }
  callback();
}


/**
 * Bind the context collector to the given data stream.
 * @param {string} protocol Listener protocol, ex: serial.
 * @param {string} source Listener source, ex: /dev/ttyUSB0.
 */
HLCServer.prototype.bind = function(protocol, source) {
  var self = this;
  this.context.bind(protocol, source);
}


module.exports = HLCServer;
