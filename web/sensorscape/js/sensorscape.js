/**
 * Copyright reelyActive 2016-2017
 * We believe in an open Internet of Things
 */


// Constant definitions
MAX_LINE_CHART_DATA_POINTS = 8;
LINE_CHART_OPTIONS = {
  legend: {
    display: true,
    position: 'bottom'
  },
  scales: {
    xAxes: [{
      type: 'linear',
      position: 'bottom'
    }]
  }
};


/**
 * sensorscape Module
 * All of the JavaScript specific to the dashboard is contained inside this
 * angular module.  The only external dependencies are:
 * - beaver (reelyActive)
 * - socket.io (btford)
 * - chart.js (jtblin)
 */
angular.module('sensorscape', [ 'ui.bootstrap', 'btford.socket-io',
                                'chart.js', 'reelyactive.beaver' ])


/**
 * Socket Factory
 * Creates the websocket connection to the given URL using socket.io.
 */
.factory('Socket', function(socketFactory, $location) {
  var url = $location.protocol() + '://' + $location.host() + ':' +
            $location.port();
  return socketFactory({
    ioSocket: io.connect(url)
  });
})


/**
 * InteractionCtrl Controller
 * Handles the manipulation of all variables accessed by the HTML view.
 */
.controller('InteractionCtrl', function($scope, Socket, beaver) {

  // Variables accessible in the HTML scope
  $scope.devices = beaver.getDevices();
  $scope.sensors = {};
  $scope.sensorAccSeries = [ 'X (g)', 'Y (g)', 'Z (g)' ];
  $scope.sensorAccColors = [ '#0770a2', '#aec844', '#ff6900' ];
  $scope.lineChartOptions = LINE_CHART_OPTIONS;

  // beaver.js listens on the websocket for events
  beaver.listen(Socket);

  // Handle events pre-processed by beaver.js
  beaver.on('appearance', function(event) {
    handleEvent('appearance', event);
  });
  beaver.on('displacement', function(event) {
    handleEvent('displacement', event);
  });
  beaver.on('keep-alive', function(event) {
    handleEvent('keep-alive', event);
  });
  beaver.on('disappearance', function(event) {
    handleEvent('disappearance', event);
  });

  // Handle an event
  function handleEvent(type, event) {
    var advData = event.tiraid.identifier.advData;

    // Sensor data as manufacturerSpecificData
    if(advData && advData.hasOwnProperty('manufacturerSpecificData') &&
       (Object.keys(advData.manufacturerSpecificData).length > 3)) {
      handleManufacturerSpecificData(advData.manufacturerSpecificData, event);
    }

    // Sensor data as service data
    if(advData && advData.hasOwnProperty('serviceData') &&
       (Object.keys(advData.serviceData).length > 2)) {
      handleServiceData(advData.serviceData, event);
    }
  }

  // Handle manufacturerSpecificData
  function handleManufacturerSpecificData(data, event) {
    if(data.hasOwnProperty('nearable')) {
      handleNearable(data.nearable, event);
    }
  }

  // Handle serviceData
  function handleServiceData(data, event) {
    if(data.hasOwnProperty('minew')) {
      handleMinew(data.minew, event);
    }
  }

  // Handle Estimote Nearables
  function handleNearable(nearable, event) {

    // First decoding
    if(!$scope.sensors.hasOwnProperty(nearable.id)) {
      $scope.sensors[nearable.id] = {
        type: "nearable",
        data: nearable,
        time: event.time,
        initialTime: event.time,
        accData: [
          [ { x: 0, y: nearable.accelerationX } ],
          [ { x: 0, y: nearable.accelerationY } ],
          [ { x: 0, y: nearable.accelerationZ } ]
        ]
      };
    }

    // Subsequent decodings (with later event time!)
    else if(event.time > $scope.sensors[nearable.id].time) {
      var sensor = $scope.sensors[nearable.id];
      var time = (event.time - sensor.initialTime) / 1000;
      sensor.accData[0].push( { x: time, y: nearable.accelerationX } );
      sensor.accData[1].push( { x: time, y: nearable.accelerationY } );
      sensor.accData[2].push( { x: time, y: nearable.accelerationZ } );
      if(sensor.accData[0].length > MAX_LINE_CHART_DATA_POINTS) {
        sensor.accData[0].shift();
        sensor.accData[1].shift();
        sensor.accData[2].shift();
      }
      sensor.data = nearable;
      sensor.time = event.time;
    }
  }

  // Handle Minew i7 accelerometer beacon
  function handleMinew(minew, event) {

    if(minew.frameType !== 'a1') {
      return;
    }

    // First decoding
    if(!$scope.sensors.hasOwnProperty(minew.macAddress)) {
      $scope.sensors[minew.macAddress] = {
        type: "Minew",
        data: minew,
        time: event.time,
        initialTime: event.time,
        accData: [
          [ { x: 0, y: minew.accelerationX } ],
          [ { x: 0, y: minew.accelerationY } ],
          [ { x: 0, y: minew.accelerationZ } ]
        ]
      }
    }

    // Subsequent decodings (with later event time!)
    else if(event.time > $scope.sensors[minew.macAddress].time) {
      var sensor = $scope.sensors[minew.macAddress];
      var time = (event.time - sensor.initialTime) / 1000;
      sensor.accData[0].push( { x: time, y: minew.accelerationX } );
      sensor.accData[1].push( { x: time, y: minew.accelerationY } );
      sensor.accData[2].push( { x: time, y: minew.accelerationZ } );
      if(sensor.accData[0].length > MAX_LINE_CHART_DATA_POINTS) {
        sensor.accData[0].shift();
        sensor.accData[1].shift();
        sensor.accData[2].shift();
      }
      sensor.data = minew;
      sensor.time = event.time;
    }
  }

});
