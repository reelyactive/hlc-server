/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const express = require('express');
const path = require('path');
const responseHandler = require('./responsehandler');


let router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveStatus(req, res);
  });


/**
 * Retrieve the current status.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveStatus(req, res) {
  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/status/index.html'));
      break;
    default:
      let status = req.hlcserver.status;
      status.retrieve(function(status, data) {
        let response = responseHandler.prepareResponse(req, status, data);
        res.status(status).json(response);
      });
      break;
  }
}


module.exports = router;
