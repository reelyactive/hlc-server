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
  });


router.route('/:id')
  .get(function(req, res) {
    retrieveDeviceAssociation(req, res); // TODO: change
  });


router.route('/:id/association')
  .get(function(req, res) {
    retrieveDeviceAssociation(req, res);
  })
  .put(function(req, res) {
    replaceDeviceAssociation(req, res);
  })
  .delete(hlcserver.apiAuthentication, function(req, res) { // TODO: update authentication
    deleteDeviceAssociation(req, res);
  });


router.route('/:id/context')
  .get(function(req, res) {
    retrieveDeviceContext(req, res);
  });


/**
 * Retrieve all devices.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveDevices(req, res) {
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  var status = responseHandler.NOTIMPLEMENTED;
  var response = responseHandler.prepareResponse(status, rootUrl, queryPath);
  res.status(status).json(response);
}


/**
 * Retrieve a specific device association.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveDeviceAssociation(req, res) {
  var id = req.param('id');
  var parameters = {};
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.getDeviceAssociation(id, parameters, rootUrl,
                                      queryPath, function(response, status) {
    res.status(status).json(response);
  });
}


/**
 * Replace the specified device association.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replaceDeviceAssociation(req, res) {
  var id = req.param('id');
  var identifiers = req.body.identifiers;
  var url = req.body.url;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.setDeviceAssociation(id, identifiers, url, rootUrl,
                                      queryPath, function(response, status) {
    res.status(status).json(response);
  });
}


/**
 * Delete the specified device association.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function deleteDeviceAssociation(req, res) {
  var id = req.param('id');
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.removeDeviceAssociation(id, rootUrl, queryPath,
                                                  function(response, status) {
    res.status(status).json(response);
  });
}


/**
 * Retrieve the context of a specific device.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveDeviceContext(req, res) {
  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/response.html'));
      break;
    default:
      var devices = [ req.param('id') ];
      var rootUrl = req.protocol + '://' + req.get('host');
      var queryPath = req.originalUrl;
      req.instance.api.getDevicesContext(devices, rootUrl, queryPath,
                                         function(response, status) {
        res.status(status).json(response);
      });
      break;
  }
}


module.exports = router;
