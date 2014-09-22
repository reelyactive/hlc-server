var nedb = require('nedb');

var ASSOCIATION_DB = "urls.db";


/**
 * AssociationManager Class
 * Manages the association of identifiers with URLs
 * @constructor
 */
function AssociationManager() {
  var self = this;
  this.db = new nedb({filename: ASSOCIATION_DB, autoload: true });
};


/**
 * Find and append any URL associated with each device identifier
 * @param {Object} identifiers List of identifiers.
 * @param {function} callback Function to call on completion.
 */
AssociationManager.prototype.link = function(identifiers, callback) {
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
    callback(identifiers);
  });
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
