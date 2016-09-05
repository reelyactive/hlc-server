/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */


DISAPPEARANCE_MILLISECONDS = 15000;


angular.module('reelyactive.beaver', [])

  .factory('beaver', function beaverFactory() {

    var devices = {};
    var directories = {};
    var stats = { appearances: 0, displacements: 0, keepalives: 0,
                  disappearances: 0 };
    var eventCallbacks = {};


    // Use the given event to update the status of the corresponding device
    function updateDevice(type, event) {
      if(!isValidEvent) {
        return;
      }

      if(!event.hasOwnProperty('deviceId') && event.hasOwnProperty('tiraid')) {
        updateLegacyEvent(event);
      }

      var deviceId = event.deviceId;
      if(!devices.hasOwnProperty(deviceId)) {
        type = 'appearance';
      }

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
        devices[deviceId] = { event:  event };
      }
      else {
        mergeDeviceEvents(devices[deviceId], event);
      }

      handleEventCallback(type, event);
    }


    // Verify if the given event is valid
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


    // Update the given event to the current format
    function updateLegacyEvent(event) {
      event.deviceId = event.tiraid.identifier.value;
      event.time = new Date(event.tiraid.timestamp);
      event.receiverId = event.tiraid.radioDecodings[0].identifier.value;
      event.rssi = event.tiraid.radioDecodings[0].rssi;
      return;
    }


    // Merge any previous device event with the given one
    function mergeDeviceEvents(device, event) {
      device.event.event = event.event;
      device.event.time = event.time;
      device.event.deviceAssociationIds = event.deviceAssociationIds ||
                                          device.event.deviceAssociationIds;
      device.event.deviceUrl = event.deviceUrl || device.event.deviceUrl;
      device.event.deviceTags = event.deviceTags || device.event.deviceTags;
      device.event.receiverId = event.receiverId;
      device.event.receiverUrl = event.receiverUrl;
      device.event.receiverTags = event.receiverTags;
      device.event.receiverDirectory = event.receiverDirectory;
      device.event.rssi = event.rssi;
      device.event.rssiType = event.rssiType;
    }


    // Update the directories of devices
    function updateDirectories(event) {
      var directory = event.receiverDirectory;
      var deviceId = event.deviceId;

      for(cDirectory in directories) {
        if((directory === cDirectory) && (event.event !== 'disappearance')) {
          addReceiver(directory, event);
          directories[cDirectory].devices[deviceId] = devices[deviceId];
        }
        else if(directories[cDirectory].devices.hasOwnProperty(deviceId)) {
          delete directories[cDirectory].devices[deviceId];
        }
      }

      if(!directories.hasOwnProperty(directory)) {
        directories[directory] = { receivers: {}, devices: {} };
        addReceiver(directory, event);
        directories[directory].devices[deviceId] = devices[deviceId];
      }
    }


    // Add the receiver to the given directory
    function addReceiver(directory, event) {
      if(!directories[directory].receivers.hasOwnProperty(event.receiverId)) {
        directories[directory].receivers[event.receiverId] = {
          receiverId: event.receiverId,
          receiverTags: event.receiverTags,
          receiverDirectory: directory,
          receiverUrl: event.receiverUrl
        };
      }
    }


    // Handle any registered callbacks for the given event type
    function handleEventCallback(type, device) {
      var callback = eventCallbacks[type];
      if(callback) {
        callback(device);
      }
    }


    // Register a callback for the given event type
    var setEventCallback = function(event, callback) {
      if(callback && (typeof callback === 'function')) { 
        eventCallbacks[event] = callback;
      }
    }


    // Add the given property to the given device
    function addDeviceProperty(deviceId, property, value) {
      if(!devices.hasOwnProperty(deviceId) || !property ||
         (typeof(property) !== 'string')) {
        return false;
      }
      devices[deviceId][property] = value;
      return true;
    }


    // Add the given property to the given directory
    function addDirectoryProperty(directory, property, value) {
      if(!directories.hasOwnProperty(directory) || !property ||
         (typeof(property) !== 'string')) {
        return false;
      }
      directories[directory][property] = value;
      return true;
    }


    // Purge any stale devices as disappearances
    function purgeDisappearances() {
      var currentTime = new Date();
      for(cDevice in devices) {
        if((currentTime - devices[cDevice].event.time) >
           DISAPPEARANCE_MILLISECONDS) {
          handleEventCallback('disappearance', devices[cDevice].event);
          delete devices[cDevice];
          stats.disappearances++;
        }
      }
    }


    // Handle incoming socket events by type
    var handleSocketEvents = function(Socket) {

      Socket.on('appearance', function(event) {
        updateDevice('appearance', event);
        updateDirectories(event);
      });

      Socket.on('displacement', function(event) {
        updateDevice('displacement', event);
        updateDirectories(event);
      });

      Socket.on('keep-alive', function(event) {
        updateDevice('keep-alive', event);
        updateDirectories(event);
      });

      Socket.on('disappearance', function(event) {
        updateDevice('disappearance', event);
        updateDirectories(event);
      });

      Socket.on('error', function(err, data) {
      });

      setInterval(purgeDisappearances, DISAPPEARANCE_MILLISECONDS);
    };


    return {
      listen: handleSocketEvents,
      on: setEventCallback,
      addDeviceProperty: addDeviceProperty,
      addDirectoryProperty: addDirectoryProperty,
      getDevices: function() { return devices; },
      getDirectories: function() { return directories; },
      getStats: function() { return stats; }
    }
  });
