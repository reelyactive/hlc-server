var barnowl = require('barnowl');
var nedb = require('nedb');

var MAX_REELCEIVERS = 4;
var MAX_STALE_MILLISECONDS = 15000;
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
function ContextManager() {
  var self = this;
  this.middleware = new barnowl(MAX_REELCEIVERS, true);
  this.db = new nedb();

  this.middleware.on('visibilityEvent', function(tiraid) {
    upsert(self, tiraid);
  });

  function periodicMaintenance() {
    removeStaleDocuments(self);
  }

  setInterval(periodicMaintenance, MAX_STALE_MILLISECONDS);
};


/**
 * Upsert the given tiraid in the database
 * @param {ContextManager} instance The given instance.
 * @param {tiraid} tiraid The tiraid to upsert.
 */
function upsert(instance, tiraid) {
  var _id = tiraid.identifier.value;
  instance.db.update({ _id: _id }, { $push: { transmissions: tiraid } },
                     { upsert: true });
}


/**
 * Removes all stale tiraids from the database
 * @param {ContextManager} instance The given instance.
 */
function removeStaleDocuments(instance) {
  var currentDate = new Date();
  var cutoffDate = currentDate.setMilliseconds(currentDate.getMilliseconds()
                                               - MAX_STALE_MILLISECONDS);
  var cutoffTime = new Date(cutoffDate).toISOString();

  instance.db.update({}, { $pull: { transmissions: { timestamp: { $lt: cutoffTime } } } },
                     { multi: true });
}


/**
 * Bind the middleware to the given data stream.
 * @param {string} protocol Listener protocol, ex: serial.
 * @param {string} source Listener source, ex: /dev/ttyUSB0.
 */
ContextManager.prototype.bind = function(protocol, source) {
  var self = this;
  this.middleware.bind(protocol, source);
};


/**
 * Search through the database and find all tiraids which have at least one of
 * the given ids as their own id or as that of one of their decoders.
 * @param {Object} params Parameters on which to search.
 * @param {function} callback Function to call on completion.
 */
ContextManager.prototype.findNearby = function(params, callback) {
  var self = this;

  this.db.find({ $or: [{ _id: { $in: params.ids } },
                       { "transmissions.radioDecodings.identifier.value":
                         { $in: params.ids } }] },
               { _id: 0 }, function(err, matching) {
    var nearby = {};
    if(params.place === TEST_PLACE) {
      nearby[TEST_IDENTIFIER] = TEST_IDENTIFIER_OBJECT;
    }
    for(var cId = 0; cId < matching.length; cId++) {
      var transmissions = matching[cId].transmissions;
      var latestTransmission = transmissions.pop();
      var latestIdentifier = latestTransmission.identifier;
      var identifierValue = latestIdentifier.value;
      nearby[identifierValue] = { "identifier": latestIdentifier };
    }
    callback(nearby, params);
  });
}


module.exports = ContextManager;
