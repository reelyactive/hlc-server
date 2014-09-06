var http = require('http');
var express = require('express');
var contextManager = require('./contextmanager');
var placeManager = require('./placemanager');
var associationManager = require('./associationmanager');

var HTTP_PORT = 3000;


/**
 * HLCServer Class
 * Serves up hyperlocal context (HLC) for the Internet of Things.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function HLCServer(options) {
  var self = this;
  var app = express();
  this.context = new contextManager();
  this.places = new placeManager();
  this.associations = new associationManager();

  app.use('/', express.static(__dirname + '/../web'));

  app.get('/id/:id', function(req, res) {
    var id = req.param('id');
    self.context.findNearby([id], function(nearby) {
      self.associations.link(nearby, function(linked) {
        res.json(linked);
      });
    });
  });

  app.get('/at/:place', function(req, res) {
    var place = req.param('place');
    self.places.getIDs(place, function(ids) {
      self.associations.link(ids, function(linked) {
        res.json(linked);
      });
    });
  });

  app.listen(HTTP_PORT);
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
