/**
 * Copyright reelyActive 2018
 * We believe in an open Internet of Things
 */


DEFAULT_EVENT_INTERVAL_MILLISECONDS = 2000;


angular.module('reelyactive.examples', [])

  .factory('examples', function examplesFactory($interval, $timeout) {

    var eventCallbacks = {};
    var backgroundUrl;

    // Office event generator
    function generateOfficeEvents() {
      var devices = [
        { id: "000000000001",
          url: "https://www.reelyactive.com/stories/people/daphne/" },
        { id: "000000000002",
          url: "https://www.reelyactive.com/stories/people/deshawn/" },
        { id: "000000000003",
          url: "https://www.reelyactive.com/stories/people/eric/" },
        { id: "000000000004",
          url: "https://www.reelyactive.com/stories/people/jeffrey/" },
        { id: "000000000005",
          url: "https://www.reelyactive.com/stories/people/karim/" },
        { id: "000000000006",
          url: "https://www.reelyactive.com/stories/people/kim/" },
        { id: "000000000007",
          url: "https://www.reelyactive.com/stories/people/kyle/" },
        { id: "000000000008",
          url: "https://www.reelyactive.com/stories/people/maggie/" },
        { id: "000000000009",
          url: "https://www.reelyactive.com/stories/people/monique/" },
        { id: "00000000000a",
          url: "https://www.reelyactive.com/stories/people/philippe/" },
        { id: "00000000000b",
          url: "https://www.reelyactive.com/stories/people/terrance/" },
        { id: "00000000000c",
          url: "https://www.reelyactive.com/stories/people/tina/" }
      ];
      var receivers = [
        { id: "001bc50940810000",
          url: "https://www.reelyactive.com/stories/office/reception/",
          directory: 'office:reception' },
        { id: "001bc50940810001",
          url: "https://www.reelyactive.com/stories/office/elevators/",
          directory: 'office:elevators' },
        { id: "001bc50940810002",
          url: "https://www.reelyactive.com/stories/office/kitchen/",
          directory: 'office:kitchen' },
        { id: "001bc50940810003",
          url: "https://www.reelyactive.com/stories/office/lounge/",
          directory: 'office:lounge' },
        { id: "001bc50940810004",
          url: "https://www.reelyactive.com/stories/office/supplies/",
          directory: 'office:supplies' },
        { id: "001bc50940810005",
          url: "https://www.reelyactive.com/stories/office/conferenceroom/",
          directory: 'office:conferenceroom' },
        { id: "001bc50940810006",
          url: "https://www.reelyactive.com/stories/office/hotdesking/",
          directory: 'office:hotdesking' }
      ];
      for(var cEvent = 0; cEvent < devices.length; cEvent++) {
        $timeout(handleEventCallback, cEvent, false, 'appearance',
                 createEvent(devices, receivers));
      }
      $interval(function() {
        var event = createEvent(devices, receivers);
        handleEventCallback('appearance', event);
      }, DEFAULT_EVENT_INTERVAL_MILLISECONDS);
    }

    // Office event generator (with barnowls)
    function generateOfficeBarnowlsEvents() {
      var devices = [
        { id: "000000000001",
          url: "https://www.reelyactive.com/stories/barnowls/barnardine/" },
        { id: "000000000002",
          url: "https://www.reelyactive.com/stories/barnowls/barney/" },
        { id: "000000000003",
          url: "https://www.reelyactive.com/stories/barnowls/barnice/" },
        { id: "000000000004",
          url: "https://www.reelyactive.com/stories/barnowls/barntholomew/" },
        { id: "000000000005",
          url: "https://www.reelyactive.com/stories/barnowls/mcowla/" },
        { id: "000000000006",
          url: "https://www.reelyactive.com/stories/barnowls/owlain/" },
        { id: "000000000007",
          url: "https://www.reelyactive.com/stories/barnowls/owlison/" },
        { id: "000000000008",
          url: "https://www.reelyactive.com/stories/barnowls/owlistair/" },
        { id: "000000000009",
          url: "https://www.reelyactive.com/stories/barnowls/owlivia/" },
        { id: "00000000000a",
          url: "https://www.reelyactive.com/stories/barnowls/powlette/" },
        { id: "00000000000b",
          url: "https://www.reelyactive.com/stories/barnowls/rowlf/" },
        { id: "00000000000c",
          url: "https://www.reelyactive.com/stories/barnowls/sunny/" }
      ];
      var receivers = [
        { id: "001bc50940810000",
          url: "https://www.reelyactive.com/stories/office/reception/",
          directory: 'office:reception' },
        { id: "001bc50940810001",
          url: "https://www.reelyactive.com/stories/office/elevators/",
          directory: 'office:elevators' },
        { id: "001bc50940810002",
          url: "https://www.reelyactive.com/stories/office/kitchen/",
          directory: 'office:kitchen' },
        { id: "001bc50940810003",
          url: "https://www.reelyactive.com/stories/office/lounge/",
          directory: 'office:lounge' },
        { id: "001bc50940810004",
          url: "https://www.reelyactive.com/stories/office/supplies/",
          directory: 'office:supplies' },
        { id: "001bc50940810005",
          url: "https://www.reelyactive.com/stories/office/conferenceroom/",
          directory: 'office:conferenceroom' },
        { id: "001bc50940810006",
          url: "https://www.reelyactive.com/stories/office/hotdesking/",
          directory: 'office:hotdesking' }
      ];
      for(var cEvent = 0; cEvent < devices.length; cEvent++) {
        $timeout(handleEventCallback, cEvent, false, 'appearance',
                 createEvent(devices, receivers));
      }
      $interval(function() {
        var event = createEvent(devices, receivers);
        handleEventCallback('appearance', event);
      }, DEFAULT_EVENT_INTERVAL_MILLISECONDS);
    }

    // Hospital event generator (staff only)
    function generateHospitalStaffEvents() {
      var devices = [
        { id: "000000000001",
          url: "https://www.reelyactive.com/stories/hospital/staff/darryl/",
          receivers: [ 0, 2, 3, 3 ] },
        { id: "000000000002",
          url: "https://www.reelyactive.com/stories/hospital/staff/devin/",
          receivers: [ 0, 2, 3, 3 ] },
        { id: "000000000003",
          url: "https://www.reelyactive.com/stories/hospital/staff/nancy/",
          receivers: [ 0, 2, 3, 4 ] },
        { id: "000000000004",
          url: "https://www.reelyactive.com/stories/hospital/staff/natasha/",
          receivers: [ 0, 2, 3, 4 ] },
        { id: "000000000005",
          url: "https://www.reelyactive.com/stories/hospital/staff/nathalie/",
          receivers: [ 0, 2, 3, 4 ] },
        { id: "000000000006",
          url: "https://www.reelyactive.com/stories/hospital/staff/nina/",
          receivers: [ 0, 2, 3, 4 ] },
        { id: "000000000007",
          url: "https://www.reelyactive.com/stories/hospital/staff/ophelia/",
          receivers: [ 0, 1, 1, 1, 2, 3, 4 ] },
        { id: "000000000008",
          url: "https://www.reelyactive.com/stories/hospital/staff/sam/",
          receivers: [ 2, 2, 3 ] },
        { id: "000000000009",
          url: "https://www.reelyactive.com/stories/hospital/staff/simon/",
          receivers: [ 2, 2, 3 ] }
      ];
      var receivers = [
        { id: "001bc50940810000",
          url: "https://www.reelyactive.com/stories/hospital/admissions/",
          directory: 'hospital:admissions' },
        { id: "001bc50940810001",
          url: "https://www.reelyactive.com/stories/hospital/equipmentroom/",
          directory: 'hospital:equipmentroom' },
        { id: "001bc50940810002",
          url: "https://www.reelyactive.com/stories/hospital/operatingroom/",
          directory: 'hospital:operatingroom' },
        { id: "001bc50940810003",
          url: "https://www.reelyactive.com/stories/hospital/recovery/",
          directory: 'hospital:recovery' },
        { id: "001bc50940810004",
          url: "https://www.reelyactive.com/stories/hospital/waitingroom/",
          directory: 'hospital:waitingroom' }
      ];
      for(var cEvent = 0; cEvent < devices.length; cEvent++) {
        $timeout(handleEventCallback, cEvent, false, 'appearance',
                 createEvent(devices, receivers));
      }
      $interval(function() {
        var event = createEvent(devices, receivers);
        handleEventCallback('appearance', event);
      }, DEFAULT_EVENT_INTERVAL_MILLISECONDS);
    }

    // Hospital event generator (assets only)
    function generateHospitalAssetEvents() {
      var devices = [
        { id: "000000000001",
          url: "https://www.reelyactive.com/stories/hospital/assets/hospitalbed/",
          receivers: [ 0, 2, 2, 3, 3 ] },
        { id: "000000000002",
          url: "https://www.reelyactive.com/stories/hospital/assets/hospitalbed/",
          receivers: [ 2, 2, 3, 3, 4 ] },
        { id: "000000000003",
          url: "https://www.reelyactive.com/stories/hospital/assets/hospitalbed/",
          receivers: [ 2, 3, 3, 3 ] },
        { id: "000000000004",
          url: "https://www.reelyactive.com/stories/hospital/assets/oxygentank/",
          receivers: [ 1, 1, 4 ] },
        { id: "000000000005",
          url: "https://www.reelyactive.com/stories/hospital/assets/oxygentank/",
          receivers: [ 1, 2, 3, 3 ] },
        { id: "000000000006",
          url: "https://www.reelyactive.com/stories/hospital/assets/wheelchair/",
          receivers: [ 0, 0, 0, 4 ] },
        { id: "000000000007",
          url: "https://www.reelyactive.com/stories/hospital/assets/wheelchair/",
          receivers: [ 0, 3, 4 ] },
        { id: "000000000008",
          url: "https://www.reelyactive.com/stories/hospital/assets/wheelchair/",
          receivers: [ 0, 4, 4, 4 ] },
        { id: "000000000009",
          url: "https://www.reelyactive.com/stories/hospital/assets/wheelchair/",
          receivers: [ 0, 2, 3, 4 ] }
      ];
      var receivers = [
        { id: "001bc50940810000",
          url: "https://www.reelyactive.com/stories/hospital/admissions/",
          directory: 'hospital:admissions' },
        { id: "001bc50940810001",
          url: "https://www.reelyactive.com/stories/hospital/equipmentroom/",
          directory: 'hospital:equipmentroom' },
        { id: "001bc50940810002",
          url: "https://www.reelyactive.com/stories/hospital/operatingroom/",
          directory: 'hospital:operatingroom' },
        { id: "001bc50940810003",
          url: "https://www.reelyactive.com/stories/hospital/recovery/",
          directory: 'hospital:recovery' },
        { id: "001bc50940810004",
          url: "https://www.reelyactive.com/stories/hospital/waitingroom/",
          directory: 'hospital:waitingroom' }
      ];
      for(var cEvent = 0; cEvent < devices.length; cEvent++) {
        $timeout(handleEventCallback, cEvent, false, 'appearance',
                 createEvent(devices, receivers));
      }
      $interval(function() {
        var event = createEvent(devices, receivers);
        handleEventCallback('appearance', event);
      }, DEFAULT_EVENT_INTERVAL_MILLISECONDS);
    }

    // Mascot event generator
    function generateMascotEvents() {
      var devices = [
        { id: "000000000001",
          url: "https://www.reelyactive.com/stories/mascots/barnowl/",
          receivers: [ 0, 0, 1, 3, 3 ] },
        { id: "000000000002",
          url: "https://www.reelyactive.com/stories/mascots/barnacles/",
          receivers: [ 2 ] },
        { id: "000000000003",
          url: "https://www.reelyactive.com/stories/mascots/barterer/",
          receivers: [ 2 ] },
        { id: "000000000004",
          url: "https://www.reelyactive.com/stories/mascots/chickadee/",
          receivers: [ 0, 0, 1, 3, 3 ] },
        { id: "000000000005",
          url: "https://www.reelyactive.com/stories/mascots/starling/",
          receivers: [ 0, 0, 1, 3, 3 ] },
        { id: "000000000006",
          url: "https://www.reelyactive.com/stories/mascots/json-silo/",
          receivers: [ 0 ] },
        { id: "000000000007",
          url: "https://www.reelyactive.com/stories/mascots/beaver/",
          receivers: [ 0, 1, 1 ] },
        { id: "000000000008",
          url: "https://www.reelyactive.com/stories/mascots/cormorant/",
          receivers: [ 2, 3, 3 ] },
        { id: "000000000009",
          url: "https://www.reelyactive.com/stories/mascots/cuttlefish/",
          receivers: [ 2 ] }
      ];
      var receivers = [
        { id: "001bc50940810000",
          url: "https://www.reelyactive.com/stories/landscapes/forest/",
          directory: 'landscape:forest' },
        { id: "001bc50940810001",
          url: "https://www.reelyactive.com/stories/landscapes/lake/",
          directory: 'landscape:lake' },
        { id: "001bc50940810002",
          url: "https://www.reelyactive.com/stories/landscapes/ocean/",
          directory: 'landscape:ocean' },
        { id: "001bc50940810003",
          url: "https://www.reelyactive.com/stories/landscapes/sky/",
          directory: 'landscape:sky' }
      ];
      for(var cEvent = 0; cEvent < devices.length; cEvent++) {
        $timeout(handleEventCallback, cEvent, false, 'appearance',
                 createEvent(devices, receivers));
      }
      $interval(function() {
        var event = createEvent(devices, receivers);
        handleEventCallback('appearance', event);
      }, DEFAULT_EVENT_INTERVAL_MILLISECONDS);
    }

    // Create event
    function createEvent(devices, receivers) {
      var device = devices[Math.floor(Math.random() * devices.length)];
      var receiver = receivers[Math.floor(Math.random() * receivers.length)];
      if(device.hasOwnProperty('receivers')) {
        var receiverIndex = Math.floor(Math.random() * device.receivers.length);
        receiver = receivers[device.receivers[receiverIndex]];
      }
      return {
        deviceId: device.id,
        deviceUrl: device.url,
        deviceTags: [ 'track' ],
        receiverId: receiver.id,
        receiverUrl: receiver.url,
        receiverDirectory: receiver.directory,
        rssi: 150,
        sessionId: '7265656c-0000-4000-8048-' + device.id,
        time: new Date().getTime()
      };
    }

    // Handle any registered callback for the given event type
    function handleEventCallback(type, event) {
      var callback = eventCallbacks[type];
      if(callback) {
        callback(event);
      }
    }

    // Start the given event generator
    var generateEvents = function(example) {
      switch(example) {
        case 'mascots':
          generateMascotEvents();
          break;
        case 'hospital-staff':
          generateHospitalStaffEvents();
          break;
        case 'hospital-assets':
          generateHospitalAssetEvents();
          break;
        case 'office-barnowls':
          generateOfficeBarnowlsEvents();
          break;
        case 'office':
        default:
          generateOfficeEvents();
      }
    }

    // Register a callback for the given event type
    var setEventCallback = function(event, callback) {
      if(callback && (typeof callback === 'function')) { 
        eventCallbacks[event] = callback;
      }
    }

    return {
      generate: generateEvents,
      on: setEventCallback
    }
  });
