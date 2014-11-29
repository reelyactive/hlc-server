/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var barnowl = require('barnowl');
var barnacles = require('barnacles');

var DEFAULT_MAX_DECODERS = 3;
var DEFAULT_MAX_STALE_MILLISECONDS = 10000;
var TEST_PLACE = "test";
var TEST_IDENTIFIER = "001bc50940100000";
var TEST_IDENTIFIER_OBJECT = { "identifier":
                                { "type": "EUI-64",
                                  "value": "001bc50940100000" }
                             };


/**
 * ContextManager Class
 * Collects and manages context from middleware in a database
 * @constructor
 */
function ContextManager(options) {
  var self = this;
  this.maxDecoders = options.maxDecoders || DEFAULT_MAX_DECODERS;
  this.maxStaleMilliseconds = options.maxStaleMilliseconds ||
                              DEFAULT_MAX_STALE_MILLISECONDS;
  this.middleware = new barnowl( { n: self.maxDecoders, enableMixing: true } );
  this.notifications = new barnacles( { disappearanceMilliseconds:
                                          self.maxStaleMilliseconds } );

  this.notifications.bind( { barnowl: self.middleware } );
};


/**
 * Bind the middleware to the given data stream.
 * @param {Object} options The options as a JSON object.
 */
ContextManager.prototype.bind = function(options) {
  var self = this;
  this.middleware.bind(options);
};


/**
 * Query the database for all tiraids which have at least one of the given
 * ids as their own id or as that of one of their decoders.
 * @param {Object} params Parameters on which to search.
 * @param {function} callback Function to call on completion.
 */
ContextManager.prototype.findNearby = function(params, callback) {
  var self = this;
  this.notifications.getState( { ids: params.ids }, function(nearby) {
    if(params.place === TEST_PLACE) {
      nearby[TEST_IDENTIFIER] = TEST_IDENTIFIER_OBJECT;
    }
    callback(nearby, params);
  });
}


module.exports = ContextManager;
