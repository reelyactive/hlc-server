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
    retrievePlaces(req, res);
  })
  .post(hlcserver.apiAuthentication, function(req, res) { // TODO: update authentication source
    createPlace(req, res);
  });


router.route('/:place')
  .get(function(req, res) {
    retrievePlace(req, res);
  })
  .put(hlcserver.apiAuthentication, function(req, res) { // TODO: update authentication source
    replacePlace(req, res);
  })
  .delete(hlcserver.apiAuthentication, function(req, res) { // TODO: update authentication source
    deletePlace(req, res);
  });


/**
 * Retrieve all places.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrievePlaces(req, res) {
  var status = responseHandler.NOTIMPLEMENTED;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  var response = responseHandler.prepareResponse(status, rootUrl, queryPath);
  res.status(status).json(response);
}


/**
 * Create a place.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function createPlace(req, res) {
  var place = req.body.place;
  var identifiers = req.body.identifiers;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.addPlace(place, identifiers, rootUrl, queryPath,
                                     function(response, status) {
    res.status(status).json(response);
  });
}


/**
 * Retrieve a specific place.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrievePlace(req, res) {
  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/response.html'));
      break;
    default:
      var place = req.param('place');
      var rootUrl = req.protocol + '://' + req.get('host');
      var queryPath = req.originalUrl;
      req.instance.api.getPlace(place, rootUrl, queryPath,
                                function(response, status) {
        res.status(status).json(response);
      });
      break;
  }
}


/**
 * Replace the specified place.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replacePlace(req, res) {
  var place = req.param('place');
  var identifiers = req.body.identifiers;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.setPlace(place, identifiers, rootUrl, queryPath,
                                     function(response, status) {
    res.status(status).json(response);
  });
}


/**
 * Delete the specified place.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function deletePlace(req, res) {
  var place = req.param('place');
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.associations.removePlace(place, rootUrl, queryPath,
                                        function(response, status) {
    res.status(status).json(response);
  });
}


module.exports = router;
