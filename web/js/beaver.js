/**
 * Copyright reelyActive 2016-2018
 * We believe in an open Internet of Things
 */


DEFAULT_DISAPPEARANCE_MILLISECONDS = 15000;
DEFAULT_POLLING_MILLISECONDS = 5000;
DEFAULT_MERGE_EVENTS = false;
DEFAULT_MERGE_EVENT_PROPERTIES = [ 'event', 'time', 'rssi', 'receiverId', 
                                   'receiverDirectory', 'receiverUrl',
                                   'position', 'sessionDuration',
                                   'passedFilters' ];
DEFAULT_RETAIN_EVENT_PROPERTIES = [ 'event', 'time', 'deviceId', 'deviceTags',
                                    'deviceUrl', 'deviceAssociationIds',
                                    'rssi', 'receiverId', 'receiverTags',
                                    'receiverUrl', 'receiverDirectory',
                                    'position', 'sessionId',
                                    'sessionDuration', 'passedFilters' ];
DEFAULT_MAINTAIN_DIRECTORIES = false;
DEFAULT_OBSERVE_ONLY_FILTERED = false;
DEFAULT_MIN_SESSION_DURATION_FILTER = 0;
DEFAULT_MAX_SESSION_DURATION_FILTER = Number.MAX_SAFE_INTEGER;
DEFAULT_IS_PERSON_FILTER = [ 'yes', 'possibly' ];
DEFAULT_WHITELIST_TAGS_FILTER = [ 'track' ];
DEFAULT_BLACKLIST_TAGS_FILTER = [ 'ignore' ];


angular.module('reelyactive.beaver', [])

  .factory('beaver', function beaverFactory($http) {

    var devices = {};
    var directories = {};
    var stats = { appearances: 0, displacements: 0, keepalives: 0,
                  disappearances: 0, passedFilters: 0, failedFilters: 0 };
    var eventCallbacks = {};
    var pollingApiUrl;
    var disappearanceMilliseconds = DEFAULT_DISAPPEARANCE_MILLISECONDS;
    var mergeEvents = DEFAULT_MERGE_EVENTS;
    var mergeEventProperties = DEFAULT_MERGE_EVENT_PROPERTIES;
    var retainEventProperties = DEFAULT_RETAIN_EVENT_PROPERTIES;
    var maintainDirectories = DEFAULT_MAINTAIN_DIRECTORIES;
    var observeOnlyFiltered = DEFAULT_OBSERVE_ONLY_FILTERED;
    var minSessionDurationFilter = DEFAULT_MIN_SESSION_DURATION_FILTER;
    var maxSessionDurationFilter = DEFAULT_MAX_SESSION_DURATION_FILTER;
    var isPersonFilter = DEFAULT_IS_PERSON_FILTER;
    var whitelistTagsFilter = DEFAULT_WHITELIST_TAGS_FILTER;
    var blacklistTagsFilter = DEFAULT_BLACKLIST_TAGS_FILTER;


    // Use the given event to update the status of the corresponding device
    function updateDevice(type, event) {
      if(!isValidEvent) {
        return;
      }

      if(!event.hasOwnProperty('deviceId') && event.hasOwnProperty('tiraid')) {
        updateLegacyEvent(event);
      }

      applyFilters(event);

      var deviceId = event.deviceId;
      if(!devices.hasOwnProperty(deviceId)) {
        type = 'appearance';
      }

      if(type === 'appearance') {
        if(!devices.hasOwnProperty(deviceId)) {
          stats.appearances++;
        }
        else if(devices[deviceId].event.receiverId === event.receiverId) {
          type = 'keep-alive';   // appearance is actually keep-alive
          event.type = type;     //   because beaver.js never made it disappear
        }
        else {
          type = 'displacement'; // appearance is actually displacement
          event.type = type;     //   because beaver.js never made it disappear
        }
      }
      if(type === 'displacement') { stats.displacements++; }
      if(type === 'keep-alive') { stats.keepalives++; }
      if(type === 'disappearance') {
        if(devices.hasOwnProperty(deviceId)) {
          delete devices[deviceId];
        }
        stats.disappearances++;
        if(isObservedByFilters(event)) { 
          handleEventCallback(type, event);
        }
        return;
      }

      if(event.passedFilters) {
        stats.passedFilters++;
      }
      else {
        stats.failedFilters++;
        if(observeOnlyFiltered) {
          if(devices.hasOwnProperty(deviceId)) {
            delete devices[deviceId];
          }
          return;
        }
      }

      if(mergeEvents && devices.hasOwnProperty(deviceId)) {
        mergeDeviceEvents(devices[deviceId], event);
      }
      else {
        trimEventProperties(event);
        devices[deviceId] = { event:  event };
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


    // Verify if the given event is to be observed given the filters in place
    function isObservedByFilters(event) {
      return !(observeOnlyFiltered && !event.passedFilters);
    }


    // Update the given event to the current format
    function updateLegacyEvent(event) {
      event.deviceId = event.tiraid.identifier.value;
      event.time = new Date(event.tiraid.timestamp);
      event.receiverId = event.tiraid.radioDecodings[0].identifier.value;
      event.rssi = event.tiraid.radioDecodings[0].rssi;
      return;
    }


    // Apply the filters to the given event and add passedFilters property
    function applyFilters(event) {

      if(event.hasOwnProperty('deviceTags') &&
         Array.isArray(event.deviceTags)) {
        for(var cTag = 0; cTag < event.deviceTags.length; cTag++) {
          if(whitelistTagsFilter.indexOf(event.deviceTags[cTag]) >= 0) {
            event.passedFilters = true;    // Whitelisted
            return;
          }
          else if(blacklistTagsFilter.indexOf(event.deviceTags[cTag]) >= 0) {
            event.passedFilters = false;   // Blacklisted
            return;
          }
        }
      }

      if(event.hasOwnProperty('isPerson') &&
         (isPersonFilter.indexOf(event.isPerson) < 0)) {
        event.passedFilters = false;       // Failed isPerson
        return;
      }

      if(event.hasOwnProperty('sessionDuration') &&
         ((event.sessionDuration < minSessionDurationFilter) ||
          (event.sessionDuration > maxSessionDurationFilter))) {
        event.passedFilters = false;       // Failed session duration
        return;
      }

      if(event.hasOwnProperty('receiverTags') &&
         Array.isArray(event.receiverTags)) {
        for(var cTag = 0; cTag < event.receiverTags.length; cTag++) {
          var tag = event.receiverTags[cTag];
          if(tag.indexOf('minRSSI=') === 0) {
            var minRSSI = parseInt(tag.substr(8));
            if(event.rssi < minRSSI) {
              event.passedFilters = false; // Failed minimum RSSI
              return;
            }
          }
          else if(tag.indexOf('maxRSSI=') === 0) {
            var maxRSSI = parseInt(tag.substr(8));
            if(event.rssi > maxRSSI) {
              event.passedFilters = false; // Failed maximum RSSI
              return;
            }
          }
        }
      }

      event.passedFilters = true;
    }


    // Merge the updated properties of the given event with the previous event
    function mergeDeviceEvents(device, event) {
      for(var cProperty = 0; cProperty < mergeEventProperties.length;
          cProperty++) {
        var property = mergeEventProperties[cProperty];
        if(event.hasOwnProperty(property) &&
           (device.event[property] !== event[property])) {
          device.event[property] = event[property];
        }
      }
    }


    // Trim the unretained properties from the given event
    function trimEventProperties(event) {
      for(property in event) {
        if(retainEventProperties.indexOf(property) < 0) {
          delete event[property];
        }
        else {
        }
      }
    }


    // Update the directories of devices
    function updateDirectories(event) {
      var directory = event.receiverDirectory;
      var deviceId = event.deviceId;

      for(cDirectory in directories) {
        if((directory === cDirectory) && (event.event !== 'disappearance') &&
           isObservedByFilters(event)) {
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
        if((event.event !== 'disappearance') && isObservedByFilters(event)) {
          directories[directory].devices[deviceId] = devices[deviceId];
        }
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
      var currentTime = new Date().getTime();
      for(cDevice in devices) {
        var stalenessMilliseconds = currentTime - devices[cDevice].event.time;
        if(stalenessMilliseconds > disappearanceMilliseconds) {
          handleEventCallback('disappearance', devices[cDevice].event);
          delete devices[cDevice];
          stats.disappearances++;

          if(maintainDirectories) {
            for(cDirectory in directories) {
              var directory = directories[cDirectory];
              if(directory.devices.hasOwnProperty(cDevice)) {
                delete directory.devices[cDevice];
              }
            }
          }
        }
      }
    }


    // Handle incoming socket events by type
    var handleSocketEvents = function(Socket, options) {
      handleOptions(options);

      Socket.on('appearance', function(event) {
        handleEvent('appearance', event);
      });

      Socket.on('displacement', function(event) {
        handleEvent('displacement', event);
      });

      Socket.on('keep-alive', function(event) {
        handleEvent('keep-alive', event);
      });

      Socket.on('disappearance', function(event) {
        handleEvent('disappearance', event);
      });

      Socket.on('error', function(err, data) {
      });

      var intervalMilliseconds = Math.round(disappearanceMilliseconds / 2);
      setInterval(purgeDisappearances, intervalMilliseconds);
    };


    // Handle the given event
    function handleEvent(type, event) {
      updateDevice(type, event);
      if(maintainDirectories) {
        updateDirectories(event);
      }
    }


    // Update the given device from the list of polled devices
    function updatePolledDevice(deviceId, polledDevices) {
      var device = polledDevices[deviceId];
      if(!device.hasOwnProperty('nearest')) {
        return;
      }
      var receiverId = device.nearest[0].device;
      var receiver = polledDevices[receiverId];
      var event = {
        deviceId: deviceId,
        deviceAssociationIds: device.deviceAssociationIds || [],
        deviceUrl: device.url,
        deviceTags: device.tags,
        receiverId: device.nearest[0].device,
        receiverUrl: receiver.url,
        receiverTags: receiver.tags,
        receiverDirectory: receiver.directory,
        rssi: device.nearest[0].rssi,
        time: new Date().getTime()
      };
      var type = 'appearance';

      if(devices.hasOwnProperty(deviceId)) {
        if(devices[deviceId].event.receiverId === event.receiverId) {
          type = 'keep-alive';
        }
        else {
          type = 'displacement';
        }
      }
      event.event = type;

      updateDevice(type, event);
      updateDirectories(event);
    }


    // Query the polling API
    function queryApi() {
      $http({ method: 'GET', url: pollingApiUrl })
        .then(function(response) { // Success
          if(response.data.hasOwnProperty('devices')) {
            for(deviceId in response.data.devices) {
              updatePolledDevice(deviceId, response.data.devices);
            }
            purgeDisappearances();
          }
        }, function(response) {    // Error
          console.log('beaver: GET ' + pollingApiUrl + ' returned status ' +
                      response.status);
      });
    }


    // Initialise polling of API
    var initPolling = function(url, interval, options) {
      if(!url || (typeof url !== 'string')) {
        return;
      }
      handleOptions(options);

      $http.defaults.headers.common.Accept = 'application/json';
      interval = interval || DEFAULT_POLLING_MILLISECONDS;
      pollingApiUrl = url;

      queryApi();
      setInterval(queryApi, interval);
    };


    // Set the filters
    var setFilters = function(filters) {
      filters = filters || {};
      minSessionDurationFilter = filters.minSessionDuration ||
                                 minSessionDurationFilter;
      maxSessionDurationFilter = filters.maxSessionDuration ||
                                 maxSessionDurationFilter;
      isPersonFilter = filters.isPerson || isPersonFilter;
      whitelistTagsFilter = filters.whitelistTags || whitelistTagsFilter;
      blacklistTagsFilter = filters.blacklistTags || blacklistTagsFilter;
    }


    // Handle options provided when listening/polling, if any
    function handleOptions(options) {
      options = options || {};
      disappearanceMilliseconds = options.disappearanceMilliseconds ||
                                  disappearanceMilliseconds;
      mergeEvents = options.mergeEvents || mergeEvents;
      mergeEventProperties = options.mergeEventProperties ||
                             mergeEventProperties;
      retainEventProperties = options.retainEventProperties ||
                              retainEventProperties;
      maintainDirectories = options.maintainDirectories || maintainDirectories;
      observeOnlyFiltered = options.observeOnlyFiltered || observeOnlyFiltered;
      setFilters(options.filters);
    }


    return {
      listen: handleSocketEvents,
      poll: initPolling,
      on: setEventCallback,
      addDeviceProperty: addDeviceProperty,
      addDirectoryProperty: addDirectoryProperty,
      getDevices: function() { return devices; },
      getDirectories: function() { return directories; },
      getStats: function() { return stats; },
      setFilters: setFilters
    }
  });
