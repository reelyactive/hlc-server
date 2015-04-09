/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var express = require('express');
var responseHandler = require('../responsehandler');


var router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveStatistics(req, res);
  });


/**
 * Retrieve all statistics.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveStatistics(req, res) {
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.instance.notifications.getStatistics(rootUrl, queryPath,
                                           function(response, status) {
    res.status(status).json(response);
  });
}


module.exports = router;
