/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const http = require('http');
const dgram = require('dgram');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Barnowl = require('barnowl');
const BarnowlReel = require('barnowl-reel');
const Barnacles = require('barnacles');
const BarnaclesSocketIO = require('barnacles-socketio');
const Raddec = require('raddec');


const DEFAULT_HTTP_PORT = 3001;


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
    let self = this;
    options = options || {};

    let httpPort = options.httpPort || DEFAULT_HTTP_PORT;

    this.app = express();
    this.server = http.createServer(this.app);
    this.app.use(bodyParser.json());
    this.app.use('/', express.static(path.resolve(__dirname + '/../web')));

    this.udpServer = dgram.createSocket('udp4');
    this.udpServer.bind(50001, '0.0.0.0');

    this.barnowl = new Barnowl(options.barnowl);
    this.barnowl.addListener(BarnowlReel, {}, BarnowlReel.UdpListener,
                             { path: '0.0.0.0:50000' });

    if(!options.hasOwnProperty('barnacles')) {
      options.barnacles = {};
    }
    options.barnacles.barnowl = this.barnowl;
    this.barnacles = new Barnacles(options.barnacles);
    this.barnacles.addInterface(BarnaclesSocketIO, { server: this.server });

    this.udpServer.on('message', function(msg) {
      let raddec = new Raddec(msg);

      if(raddec !== null) {
        self.barnacles.handleRaddec(raddec);
      }
    });

    this.server.listen(httpPort, function() {
      console.log('reelyActive hlc-server is listening on port', httpPort);
    });
  }

  /**
   * Add the given hardware listener to barnowl.
   * @param {Class} interfaceClass The (uninstantiated) barnowl-x interface.
   * @param {Object} interfaceOptions The interface options as a JSON object.
   * @param {Class} listenerClass The (uninstantiated) listener class.
   * @param {Object} listenerOptions The listener options as a JSON object.
   */
  addListener(interfaceClass, interfaceOptions, listenerClass,
              listenerOptions) {
    this.barnowl.addListener(interfaceClass, interfaceOptions,
                             listenerClass, listenerOptions);
  }

  /**
   * Add the given interface to barnacles.
   * @param {Class} interfaceClass The (uninstantiated) barnacles-x interface.
   * @param {Object} interfaceOptions The interface options as a JSON object.
   */
  addInterface(interfaceClass, interfaceOptions) {
    this.barnacles.addInterface(interfaceClass, interfaceOptions);
  }

}


module.exports = HLCServer;
