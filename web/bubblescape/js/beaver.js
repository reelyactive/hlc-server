/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */


angular.module('reelyactive.beaver', [])

  .factory('beaver', function beaverFactory() {

    var devices = {};
    var stats = { appearances: 0, displacements: 0, keepalives: 0,
                  disappearances: 0 };
    var eventCallbacks = {};
    var conditionSatisfied = function() { return true };


    function updateDevice(type, event) {
      if(!isValidEvent || !conditionSatisfied()) {
        return;
      }

      if(!event.hasOwnProperty('deviceId') && event.hasOwnProperty('tiraid')) {
        updateLegacyEvent(event);
      }

      var deviceId = event.deviceId;
      if(type === 'appearance') { stats.appearances++; }
      if(type === 'displacement') { stats.displacements++; }
      if(type === 'keep-alive') { stats.keepalives++; }
      if(type === 'disappearance') {
        if(devices.hasOwnProperty(deviceId)) {
          delete devices[deviceId];
        }
        stats.disappearances++;
        handleEventCallback(type, event);
        return;
      }

      if(!devices.hasOwnProperty(deviceId)) {
        devices[deviceId] = event;
      }
      else {
        mergeDeviceEvents(devices[deviceId], event);
      }


      handleEventCallback(type, event);
    }


    function isValidEvent(event) {
      if(!event) {
        return false;
      }
      if(!((event.deviceId && event.receiverId && event.rssi && event.time) ||
           (event.tiraid))) {
        return false;
      }
      return true;
    }


    function updateLegacyEvent(event) {
      event.deviceId = event.tiraid.identifier.value;
      event.time = new Date(event.tiraid.timestamp);
      event.receiverId = event.tiraid.radioDecodings[0].identifier.value;
      event.rssi = event.tiraid.radioDecodings[0].rssi;
      return;
    }


    function mergeDeviceEvents(device, event) {
      device.deviceAssociationIds = event.deviceAssociationIds ||
                                    device.deviceAssociationIds;
      device.deviceUrl = event.deviceUrl || device.deviceUrl;
      device.deviceTags = event.deviceTags || device.deviceTags;
      device.receiverId = event.receiverId;
      device.receiverUrl = event.receiverUrl;
      device.receiverTags = event.receiverTags;
      device.receiverDirectory = event.receiverDirectory;
      device.rssi = event.rssi;
      device.rssiType = event.rssiType;
    }


    function handleEventCallback(type, device) {
      var callback = eventCallbacks[type];
      if(callback) {
        callback(device);
      }
    }


    var setEventCallback = function(event, callback) {
      if(callback && (typeof callback === 'function')) { 
        eventCallbacks[event] = callback;
      }
    }


    var handleSocketEvents = function(Socket, condition) {
      
      if (typeof condition !== 'undefined') {
        conditionSatisfied = condition;
      }

      Socket.on('appearance', function(event) {
        updateDevice('appearance', event, condition);
      });

      Socket.on('displacement', function(event) {
        updateDevice('displacement', event, condition);
      });

      Socket.on('keep-alive', function(event) {
        updateDevice('keep-alive', event);
      });

      Socket.on('disappearance', function(event) {
        updateDevice('disappearance', event);
      });

      Socket.on('error', function(err, data) {
      });
    };


    return {
      listen: handleSocketEvents,
      on: setEventCallback,
      getDevices: function() { return devices; },
      getStats: function() { return stats; }
    }
  });
