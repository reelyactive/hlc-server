/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const Barnowl = require('barnowl');
const Barnacles = require('barnacles');
const BarnaclesSocketIO = require('barnacles-socketio');


/**
 * HLCServer Class
 * Serves up hyperlocal context (HLC) for the Internet of Things.
 */
class HLCServer {

  /**
   * HLCServer constructor
   * @param {Object} options The configuration options.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.barnowl = new Barnowl(options.barnowl);

    if(!options.hasOwnProperty('barnacles')) {
      options.barnacles = {};
    }
    options.barnacles.barnowl = this.barnowl;
    this.barnacles = new Barnacles(options.barnacles);
    this.barnacles.addInterface(BarnaclesSocketIO, {});
  }

}


module.exports = HLCServer;
