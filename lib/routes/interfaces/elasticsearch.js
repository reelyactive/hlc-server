/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const express = require('express');
const path = require('path');
const responseHandler = require('../responsehandler');


let router = express.Router();

router.route('/')
  .post(function(req, res) {
    executeSearchQuery(req, res);
  });


/**
 * Execute the given search query.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function executeSearchQuery(req, res) {
  let elastic = req.hlcserver.elastic;
  let query = req.body;

  elastic.executeSearchQuery(query, function(status, data) {
    let response = responseHandler.prepareResponse(req, status, data);
    res.status(status).json(response);
  });
}


module.exports = router;
