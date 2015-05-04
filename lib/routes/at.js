/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var express = require('express');


var router = express.Router();


router.route('/:place')
  .get(function(req, res) {
    res.redirect('../../places/' + req.param('place') + '/context');
  });


module.exports = router;
