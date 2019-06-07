/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const os = require('os');


const DEFAULT_OS_STATUS_UPDATE_MILLISECONDS = 1000;


/**
 * StatusManager Class
 * Monitors the status and health of the system and its dependencies.
 */
class StatusManager {

  /**
   * StatusManager constructor
   * @param {Object} options The configuration options.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    let osStatusUpdateMilliseconds = options.osStatusUpdateMilliseconds ||
                                     DEFAULT_OS_STATUS_UPDATE_MILLISECONDS;

    this.memUseRatio = 0;
    this.cpuLoadRatio = 0;

    setInterval(updateOSStatus, osStatusUpdateMilliseconds, self);
  }

  /**
   * Retrieve the current status.
   * @param {callback} callback Function to call on completion.
   */
  retrieve(callback) {
    let status = {
        memUseRatio: this.memUseRatio,
        cpuLoadRatio: this.cpuLoadRatio
    };
    callback(200, { status: status });
  }

}


/**
 * Update the status of the OS parameters.
 * @param {StatusManager} instance The StatusManager instance.
 */
function updateOSStatus(instance) {
  let usedMem = Math.max(0, os.totalmem() - os.freemem());
  instance.memUseRatio = usedMem / os.totalmem();
  instance.cpuLoadRatio = os.loadavg()[0];
}


module.exports = StatusManager;
