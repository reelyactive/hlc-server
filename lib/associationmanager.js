var nedb = require('nedb');

var ASSOCIATION_DB = "urls.db";
var TEST_ASSOCIATION = { "_id": "001bc50940100000",
                         "url": "http://reelyactive.com/metadata/test.json" };


/**
 * AssociationManager Class
 * Manages the association of identifiers with URLs
 * @constructor
 */
function AssociationManager() {
  var self = this;
  this.db = new nedb({filename: ASSOCIATION_DB, autoload: true });
  this.db.insert(TEST_ASSOCIATION);
};


/**
 * Find and append any URL associated with each device identifier
 * @param {Object} identifiers List of identifiers.
 * @param {Object} params Parameters to use.
 * @param {function} callback Function to call on completion.
 */
AssociationManager.prototype.link = function(identifiers, params, callback) {
  var self = this;
  var ids = Object.keys(identifiers);

  this.db.find({ _id: { $in: ids } }, function(err, urls) {
    var lookup = {};
    for(cUrl = 0; cUrl < urls.length; cUrl++) {
      lookup[urls[cUrl]._id] = urls[cUrl].url;
    }
    for(id in lookup) {
      identifiers[id].url = lookup[id];
    }
    for(id in identifiers) {
      if(!id.url) {
        makeExternalAssociation(identifiers[id]);
      }
    }
    callback(identifiers, params);
  });
}


/**
 * Attempts to associate a device with an external API
 * @param {Object} device The given device.
 */
function makeExternalAssociation(device) {
  var advData = device.identifier.advData;
  if(advData) {
    var complete128BitUUIDs = advData.complete128BitUUIDs;
    var nonComplete128BitUUIDs = advData.nonComplete128BitUUIDs;
    var uuid = complete128BitUUIDs || nonComplete128BitUUIDs;
    switch(uuid) {
      case "7265656c794163746976652055554944":  // RA-R436
        device.url = "http://reelyactive.com/metadata/ra-r436.json";
        break;
      case "2f521f8c4d6f12269c600050e4c00067":  // WNDR
        device.url = "http://getwndr.com/reelyactive/user/" + 
                     advData.completeLocalName;
        break;
      case "d5060001a904deb947482c7f4a124842":  // MYO
        device.url = "http://reelyactive.com/metadata/myo.json";
        break;
    }
  } 
}


/**
 * Add an association to the database
 * @param {String} id Identifier to associate.
 * @param {String} url URL to associate.
 */
AssociationManager.prototype.add = function(id, url) {
  var self = this;
  this.db.update({ _id: id }, { url: url }, { upsert: true });
}


/**
 * Remove an association from the database
 * @param {String} id Identifier to remove.
 */
AssociationManager.prototype.remove = function(id) {
  var self = this;
  this.db.remove({ _id: id });
}


module.exports = AssociationManager;
