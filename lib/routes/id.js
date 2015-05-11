/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var express = require('express');


var router = express.Router();


router.route('/:id')
  .get(function(req, res) {
    if(req.param('id').substr(0, 11) === '001bc509408') {
      res.redirect('../../contextat/receiver/' + req.param('id'));
    }
    else {
      res.redirect('../../contextnear/transmitter/' + req.param('id'));
    }
  });


module.exports = router;
