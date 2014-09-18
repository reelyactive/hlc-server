var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth-connect');
var contextManager = require('./contextmanager');
var placeManager = require('./placemanager');
var associationManager = require('./associationmanager');

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

  this.app.use(bodyParser.urlencoded({ extended: false }));

  this.app.use('/', express.static(__dirname + '/../web'));

  this.app.get('/id/:id', function(req, res) {
    var id = req.param('id');
    searchByIDs(self, [id], function(result) {
      res.json(result);
    });
  });

  this.app.get('/at/:place', function(req, res) {
    var place = req.param('place');
    searchByPlace(self, place, function(result) {
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

  this.app.listen(this.httpPort, function() {
    console.log("hlc-server is listening on port " + this.httpPort);
  });
}


/**
 * Search hyperlocal context based on identifiers.
 * @param {HLCServer} instance The given HLCServer instance.
 * @param {array} ids The identifiers to search on.
 * @param {function} callback Function to call on completion.
 */
function searchByIDs(instance, ids, callback) {
  instance.context.findNearby(ids, function(nearby) {
    instance.associations.link(nearby, function(linked) {
      callback(linked);
    });
  });
}


/**
 * Search hyperlocal context based on a place.
 * @param {HLCServer} instance The given HLCServer instance.
 * @param {string} name The name of the place to search on.
 * @param {function} callback Function to call on completion.
 */
function searchByPlace(instance, name, callback) {
  instance.places.getIDs(name, function(ids) {
    if(ids) {
      searchByIDs(instance, ids, callback);
    }
    else {
      callback({ error: "Unknown place" });
    }
  });
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
