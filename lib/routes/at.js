/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var express = require('express');
var path = require('path');
var responseHandler = require('../responsehandler');


var router = express.Router();


router.route('/:place')
  .get(function(req, res) {
    retrievePlaceContext(req, res);
  });


/**
 * Retrieve the context of a specific place.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrievePlaceContext(req, res) {
  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/response.html'));
      break;
    default:
      var name = req.param('place');
      var rootUrl = req.protocol + '://' + req.get('host');
      var queryPath = req.originalUrl;
      req.instance.api.getPlaceContext(name, rootUrl, queryPath,
                                       function(response, status) {
        res.status(status).json(response);
      });
      break;
  }
}


module.exports = router;
