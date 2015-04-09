/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var express = require('express');
var path = require('path');
var responseHandler = require('../responsehandler');
var hlcserver = require('../server'); // TODO: update authentication source


var router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveDevices(req, res);
  })
  .post(function(req, res) {
    createDevice(req, res);
  });


router.route('/:id')
  .get(function(req, res) {
    retrieveDevice(req, res);
  })
  .put(function(req, res) {
    replaceDevice(req, res);
  })
  .delete(hlcserver.apiAuthentication, function(req, res) { // TODO: update authentication source
    deleteDevice(req, res);
  });


/**
 * Retrieve all devices.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveDevices(req, res) {
  var status = responseHandler.NOTIMPLEMENTED;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  var response = responseHandler.prepareResponse(status, rootUrl, queryPath);
  res.status(status).json(response);
}


/**
 * Create a device.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function createDevice(req, res) {
  var identifier = req.body.identifier;
  var url = req.body.url;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.addDevice(identifier, url, rootUrl, queryPath,
                                      function(response, status) {
    res.status(status).json(response);
  });
}


/**
 * Retrieve a specific device.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveDevice(req, res) {
  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/response.html'));
      break;
    default:
      var identifiers = [ req.param('id') ];
      var rootUrl = req.protocol + '://' + req.get('host');
      var queryPath = req.originalUrl;
      req.instance.api.getDevices(identifiers, rootUrl, queryPath,
                                  function(response, status) {
        res.status(status).json(response);
      });
      break;
  }
}


/**
 * Replace the specified device.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replaceDevice(req, res) {
  var id = req.param('id');
  var identifier = req.body.identifier;
  var url = req.body.url;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.setDevice(id, identifier, url, rootUrl, queryPath,
                                      function(response, status) {
    res.status(status).json(response);
  });
}


/**
 * Delete the specified device.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function deleteDevice(req, res) {
  var id = req.param('id');
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.removeDevice(id, rootUrl, queryPath,
                                         function(response, status) {
    res.status(status).json(response);
  });
}


module.exports = router;
