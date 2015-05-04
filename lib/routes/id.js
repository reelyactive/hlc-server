/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var express = require('express');
var path = require('path');
var responseHandler = require('../responsehandler');
var hlcserver = require('../server'); // TODO: update authentication source


var router = express.Router();


router.route('/:id')
  .get(function(req, res) {
    retrieveDeviceContext(req, res);
  });


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
