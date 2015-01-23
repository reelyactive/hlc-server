/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var nedb = require('nedb');

var PLACE_DB = "hlc-places.db";
var TEST_PLACE = "test";
var TEST_IDS = [ "001bc50940800000", "001bc50940810000" ];


/**
 * PlaceManager Class
 * Manages the database of places
 * @constructor
 */
function PlaceManager() {
  var self = this;
  this.db = new nedb({filename: PLACE_DB, autoload: true });
};


/**
 * Find all IDs associated with the given place, if defined
 * @param {Object} params Parameters to search for.
 * @param {function} callback Function to call on completion.
 */
PlaceManager.prototype.getIDs = function(params, callback) {
  var self = this;
  if(params.place === TEST_PLACE) {
    params.ids = TEST_IDS;
    callback(params);
  }
  else {
    this.db.find({ _id: params.place }, { _id: 0 }, function(err, ids) {
      if(!ids[0]) {
        callback(params);
        return;
      }
      params.ids = ids[0].ids;
      callback(params);
    });
  }
}


/**
 * Add a place to the database
 * @param {String} name Name of the place to add.
 * @param {array} ids Array of ids associated with the place.
 */
PlaceManager.prototype.add = function(name, ids) {
  var self = this;
  var idArray = ids.split(',');
  this.db.update({ _id: name }, { ids: idArray }, { upsert: true });
}


/**
 * Remove a place from the database
 * @param {String} name Name of the place to remove.
 */
PlaceManager.prototype.remove = function(name) {
  var self = this;
  this.db.remove({ _id: name });
}


module.exports = PlaceManager;
