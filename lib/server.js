var http = require('http');
var express = require('express');

var HTTP_PORT = 3000;


/**
 * hlcServer Class
 * Serves up hyperlocal context (HLC) for the Internet of Things.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function hlcServer(options) {
  var app = express();

  app.use('/', express.static(__dirname + '/../web'));

  app.get('/id/:id', function(req, res) {
    var id = req.param('id');
    res.json({ id: id });
  });

  app.get('/at/:place', function(req, res) {
    var place = req.param('place');
    res.json({ place: place });
  });

  app.listen(HTTP_PORT);
}


module.exports = hlcServer;
