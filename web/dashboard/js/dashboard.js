/**
 * Copyright reelyActive 2016-2017
 * We believe in an open Internet of Things
 */


// Constant definitions
WHEREIS_TRANSMITTER = '/whereis/transmitter/';
WHATAT_RECEIVER = '/whatat/receiver/';
CONTEXTAT_DIRECTORY = '/contextat/directory/';
DEFAULT_DIRECTORY_ID = 'Unspecified';
DEFAULT_UPDATE_MILLISECONDS = 1000;
LINE_CHART_SAMPLES = 8;
LINE_CHART_SERIES = [ 'Devices', 'Displacements' ];
LINE_CHART_OPTIONS = {
  legend: {
    display: true,
    position: 'left'
  },
  scales: {
    xAxes: [{
      type: 'linear',
      position: 'bottom'
    }]
  }
};
BAR_CHART_LABELS = [ 'Max RSSI', 'Avg RSSI', 'Min RSSI' ];
BAR_CHART_OPTIONS = {};
DOUGHNUT_CHART_SAMPLES = 8;
DOUGHNUT_CHART_OPTIONS = {};
CHART_COLORS = [ '#0770a2', '#ff6900', '#aec844', '#d0dd9e',
                 '#f8b586', '#82b6cf', '#a9a9a9', '#5a5a5a' ];


/**
 * dashboard Module
 * All of the JavaScript specific to the dashboard is contained inside this
 * angular module.  The only external dependencies are:
 * - beaver and cormorant (reelyActive)
 * - socket.io (btford)
 * - angular-chart (jtblin)
 * - ui-bootstrap (Google)
 */
angular.module('dashboard', ['btford.socket-io', 'chart.js', 'ui.bootstrap',
                             'reelyactive.beaver', 'reelyactive.cormorant'])


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
 * DashCtrl Controller
 * Handles the manipulation of all variables accessed by the HTML view.
 */
.controller('DashCtrl', function($scope, $location, $interval, Socket, beaver,
                                 cormorant) {

  // Variables accessible in the HTML scope
  $scope.apiRoot = $location.protocol() + '://' + $location.host() + ':' +
                   $location.port();
  $scope.elapsedSeconds = 0;
  $scope.devices = [];
  $scope.directories = [];
  $scope.cumStats = beaver.getStats();
  $scope.curStats = { appearances: 0, keepalives: 0,
                      displacements: 0, disappearances: 0 };
  $scope.rssi = {};
  $scope.stories = [];
  $scope.linechart = { labels: [], series: LINE_CHART_SERIES, data: [[],[]],
                       options: LINE_CHART_OPTIONS };
  $scope.barchart = { labels: BAR_CHART_LABELS, data: [], options: {} };
  $scope.doughnutchart = { labels: [], data: [], options: {} };
  $scope.chartColors = CHART_COLORS;

  // Variables accessible in the local scope
  var updateSeconds = DEFAULT_UPDATE_MILLISECONDS / 1000;
  var devices = beaver.getDevices();
  var directories = beaver.getDirectories();
  var stories = cormorant.getStories();
  var storyStats = {};
  var rssi = { min: 255, max: 0, sum: 0, count: 0 };
  var appearances = 0;
  var keepalives = 0;
  var displacements = 0;
  var disappearances = 0;

  // beaver.js listens on the websocket for events
  beaver.listen(Socket);

  // Handle events pre-processed by beaver.js
  beaver.on('appearance', function(event) {
    appearances++;
    handleEvent('appearance', event);
  });
  beaver.on('displacement', function(event) {
    displacements++;
    handleEvent('displacement', event);
  });
  beaver.on('keep-alive', function(event) {
    keepalives++;
    handleEvent('keep-alive', event);
  });
  beaver.on('disappearance', function(event) {
    disappearances++;
    handleEvent('disappearance', event);
  });

  // Handle an event
  function handleEvent(type, event) {
    cormorant.getStory(event.deviceUrl, function() {
      cormorant.getStory(event.receiverUrl, function() {});
    });
  }

  // Sample the current state of all detected devices
  function sampleDevices() {
    var devicesArray = [];

    for(id in devices) {
      var device = devices[id];
      device.url = $scope.apiRoot + WHEREIS_TRANSMITTER + id;
      device.receiverUrl = $scope.apiRoot + WHATAT_RECEIVER +
                           device.event.receiverId;
      devicesArray.push(device);
      addStoryStat(device.event.deviceUrl);
      updateRssiStats(device.event.rssi);
    }

    $scope.devices = devicesArray;
  }

  // Sample the current state of the directories
  function sampleDirectories() {
    var directoryArray = [];

    for(id in directories) {
      var directory = directories[id];
      if(id !== 'null') {
        directory.id = id;
        directory.url = $scope.apiRoot + CONTEXTAT_DIRECTORY + id;
      }
      else {    
        directory.id = DEFAULT_DIRECTORY_ID;
      } 
      directory.receiverCount = Object.keys(directory.receivers).length;
      directory.deviceCount = Object.keys(directory.devices).length;
      directoryArray.push(directory);
    }

    $scope.directories = directoryArray;
  }

  // Sample the stats from the previous period
  function sampleStats() {
    var stats = {
        appearances: appearances,
        keepalives: keepalives,
        displacements: displacements,
        disappearances: disappearances
    };
    appearances = 0;
    keepalives = 0;
    displacements = 0;
    disappearances = 0;

    $scope.curStats = stats;
  }

  // Sample the RSSI from the previous period
  function sampleRssi() {
    var rssiSample = {};
    if(rssi.count > 0) {
      rssiSample = {
          min: rssi.min,
          max: rssi.max,
          avg: Math.round(rssi.sum / rssi.count),
          count: rssi.count
      };
    }
    rssi = { min: 255, max: 0, sum: 0, count: 0 };

    $scope.rssi = rssiSample;
  }

  // Update the line chart
  function updateLineChart() {
    $scope.linechart.data[0].push( { x: $scope.elapsedSeconds,
                                     y: $scope.devices.length } );
    $scope.linechart.data[1].push( { x: $scope.elapsedSeconds,
                                     y: $scope.curStats.displacements } );
    if($scope.linechart.data[0].length > LINE_CHART_SAMPLES) {
      $scope.linechart.data[0].shift();
      $scope.linechart.data[1].shift();
    }
  }

  // Update the bar chart
  function updateBarChart() {
    $scope.barchart.data = [ $scope.rssi.max, $scope.rssi.avg, $scope.rssi.min ];
  }

  // Update the doughnut chart
  function updateDoughnutChart() {
    var labels = [];
    var data = [];
    var storyStatsArray = Object.values(storyStats);
    var sampleLimit = Math.min(storyStatsArray.length, DOUGHNUT_CHART_SAMPLES);
    var cStory = 0;
    var otherCount = 0;

    function compare(a,b) {
      if(a.count < b.count) return 1;
      if(a.count > b.count) return -1;
      return 0;
    }

    storyStatsArray.sort(compare);

    for(cStory = 0; cStory < (sampleLimit - 1); cStory++) {
      labels.push(storyStatsArray[cStory].type);
      data.push(storyStatsArray[cStory].count);
    }
    while(cStory < storyStatsArray.length) {
      otherCount += storyStatsArray[cStory++].count;
    }
    labels.push('All others');
    data.push(otherCount);

    $scope.stories = storyStatsArray.slice(0, sampleLimit - 1);
    $scope.stories.push( { type: 'All others', count: otherCount } );

    $scope.doughnutchart.labels = labels;
    $scope.doughnutchart.data = data;

  }

  // Add the given story URL to the statistics
  function addStoryStat(url) {
    if(storyStats.hasOwnProperty(url)) {
      storyStats[url].count++;
    }
    else {
      var type = url;
      if(type.indexOf('Organization') >= 0) {
        type = type.substr(type.indexOf('Organization'));
      }
      else if(type.indexOf('Product') >= 0) {
        type = type.substr(type.indexOf('Product'));
      }
      storyStats[url] = { type: type, count: 1, url: url };
    }
  }

  // Add the device RSSI to the statistics
  function updateRssiStats(deviceRssi) {
    if(deviceRssi < rssi.min) {
      rssi.min = deviceRssi;
    }
    else if(deviceRssi > rssi.max) {
      rssi.max = deviceRssi;
    }
    rssi.sum += deviceRssi;
    rssi.count++;
  }

  // Periodic update of display variables
  function periodicUpdate() {
    $scope.elapsedSeconds += updateSeconds;
    storyStats = {};
    sampleDevices();
    sampleDirectories();
    sampleStats();
    sampleRssi();
    updateLineChart();
    updateBarChart();
    updateDoughnutChart();
  }

  // Update the update period
  $scope.updatePeriod = function(period) {
    if(period) {
      updateSeconds = period / 1000;
      $scope.updateMessage = "Updating every " + updateSeconds + "s";
      $interval.cancel($scope.updatePromise);
      $scope.updatePromise = $interval(periodicUpdate, period);
      periodicUpdate();
    }
    else {
      $scope.updateMessage = "Updates paused";
      $interval.cancel($scope.updatePromise);
    }
  };

  $scope.updatePeriod(DEFAULT_UPDATE_MILLISECONDS);
});
