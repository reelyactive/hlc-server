/**
 * Copyright reelyActive 2016-2017
 * We believe in an open Internet of Things
 */


// Constant definitions
MAX_LINE_CHART_DATA_POINTS = 8;
ACCELERATION_SERIES = [ 'X (g)', 'Y (g)', 'Z (g)' ];
TEMPERATURE_HUMIDITY_SERIES = [ 'Temperature (C)', 'Relative Humidity (%)' ];
MAGNETIC_FIELD_SERIES = [ 'X', 'Y', 'Z' ];
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
 * - chart.js (jtblin)
 */
angular.module('sensorscape', [ 'ui.bootstrap', 'chart.js',
                                'reelyactive.beaver' ])

/**
 * InteractionCtrl Controller
 * Handles the manipulation of all variables accessed by the HTML view.
 */
.controller('InteractionCtrl', function($scope, $location, beaver) {
  var url = $location.protocol() + '://' + $location.host() + ':' +
            $location.port();
  var socket = io.connect(url);

  // Variables accessible in the HTML scope
  $scope.devices = beaver.getDevices();
  $scope.sensors = {};
  $scope.chartColors = [ '#0770a2', '#aec844', '#ff6900' ];
  $scope.lineChartOptions = LINE_CHART_OPTIONS;

  // beaver.js listens on the websocket for events
  beaver.listen(socket);

  // Handle events pre-processed by beaver.js
  beaver.on('appearance', handleEvent);
  beaver.on('displacement', handleEvent);
  beaver.on('keep-alive', handleEvent);

  // Handle an event
  function handleEvent(event) {
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
      $scope.$apply();
    }
    else if(data.hasOwnProperty('puckyActive')) {
      handlePuckyActive(data.puckyActive, event);
      $scope.$apply();
    }
  }

  // Handle serviceData
  function handleServiceData(data, event) {
    if(data.hasOwnProperty('minew')) {
      handleMinew(data.minew, event);
      $scope.$apply();
    }
  }

  // Handle Estimote Nearables
  function handleNearable(nearable, event) {

    // First decoding
    if(!$scope.sensors.hasOwnProperty(nearable.id)) {
      $scope.sensors[nearable.id] = {
        type: "nearable",
        image: "images/nearable.jpg",
        data: nearable,
        time: event.time,
        initialTime: event.time,
        series: ACCELERATION_SERIES,
        datapoints: [
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
      sensor.datapoints[0].push( { x: time, y: nearable.accelerationX } );
      sensor.datapoints[1].push( { x: time, y: nearable.accelerationY } );
      sensor.datapoints[2].push( { x: time, y: nearable.accelerationZ } );
      if(sensor.datapoints[0].length > MAX_LINE_CHART_DATA_POINTS) {
        sensor.datapoints[0].shift();
        sensor.datapoints[1].shift();
        sensor.datapoints[2].shift();
      }
      sensor.data = nearable;
      sensor.time = event.time;
    }
  }

  // Handle Minew S1 temp/humidity and i7 accelerometer beacons
  function handleMinew(minew, event) {

    if((minew.frameType !== 'a1') ||
       !((minew.productModel === 1) || (minew.productModel === 3))) {
      return;
    }

    // First decoding
    if(!$scope.sensors.hasOwnProperty(minew.macAddress)) {
      $scope.sensors[minew.macAddress] = {
        type: "Minew",
        data: minew,
        time: event.time,
        initialTime: event.time
      }
      switch(minew.productModel) {
        case 1:
          $scope.sensors[minew.macAddress].image = "images/minew-s1.jpg";
          $scope.sensors[minew.macAddress].series =
                                                  TEMPERATURE_HUMIDITY_SERIES;
          $scope.sensors[minew.macAddress].datapoints = [
            [ { x: 0, y: minew.temperature } ],
            [ { x: 0, y: minew.humidity } ]
          ];
          break;
        case 3:
          $scope.sensors[minew.macAddress].image = "images/minew-i7.jpg";
          $scope.sensors[minew.macAddress].series = ACCELERATION_SERIES;
          $scope.sensors[minew.macAddress].datapoints = [
            [ { x: 0, y: minew.accelerationX } ],
            [ { x: 0, y: minew.accelerationY } ],
            [ { x: 0, y: minew.accelerationZ } ]
          ];
          break;
      }
    }

    // Subsequent decodings (with later event time!)
    else if(event.time > $scope.sensors[minew.macAddress].time) {
      var sensor = $scope.sensors[minew.macAddress];
      var time = (event.time - sensor.initialTime) / 1000;
      switch(minew.productModel) {
        case 1:
          sensor.datapoints[0].push( { x: time, y: minew.temperature } );
          sensor.datapoints[1].push( { x: time, y: minew.humidity } );
          break;
        case 3:
          sensor.datapoints[0].push( { x: time, y: minew.accelerationX } );
          sensor.datapoints[1].push( { x: time, y: minew.accelerationY } );
          sensor.datapoints[2].push( { x: time, y: minew.accelerationZ } );
          break;
      }
      if(sensor.datapoints[0].length > MAX_LINE_CHART_DATA_POINTS) {
        for(var cSeries = 0; cSeries < sensor.datapoints.length; cSeries++) {
          sensor.datapoints[cSeries].shift();
        }
      }
      sensor.data = minew;
      sensor.time = event.time;
    }
  }

  // Handle puckyActive
  function handlePuckyActive(puckyActive, event) {
    var puckId = event.deviceId.substr(-4);

    // First decoding
    if(!$scope.sensors.hasOwnProperty(puckId)) {
      $scope.sensors[puckId] = {
        type: "puckyActive",
        image: "images/puckjs.jpg",
        data: puckyActive,
        time: event.time,
        initialTime: event.time,
        series: MAGNETIC_FIELD_SERIES,
        datapoints: [
          [ { x: 0, y: puckyActive.magneticFieldX } ],
          [ { x: 0, y: puckyActive.magneticFieldY } ],
          [ { x: 0, y: puckyActive.magneticFieldZ } ]
        ]
      };
    }

    // Subsequent decodings (with later event time!)
    else if(event.time > $scope.sensors[puckId].time) {
      var sensor = $scope.sensors[puckId];
      var time = (event.time - sensor.initialTime) / 1000;
      sensor.datapoints[0].push( { x: time, y: puckyActive.magneticFieldX } );
      sensor.datapoints[1].push( { x: time, y: puckyActive.magneticFieldY } );
      sensor.datapoints[2].push( { x: time, y: puckyActive.magneticFieldZ } );
      if(sensor.datapoints[0].length > MAX_LINE_CHART_DATA_POINTS) {
        sensor.datapoints[0].shift();
        sensor.datapoints[1].shift();
        sensor.datapoints[2].shift();
      }
      sensor.data = puckyActive;
      sensor.time = event.time;
    }
  }

});
