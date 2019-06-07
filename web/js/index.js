/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const STATISTICS_INTERVAL_MILLISECONDS = 1000;
const STATUS_INTERVAL_MILLISECONDS = 2000;
const STATUS_ROUTE = '/status';

// DOM elements
let raddecRate = document.querySelector('#raddecRate');
let numTransmitters = document.querySelector('#numTransmitters');
let mem = document.querySelector('#mem');
let cpu = document.querySelector('#cpu');

// Other variables
let raddecCount = 0;

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  raddecCount++
});

// Update statistics
function updateStatistics() {
  raddecRate.textContent = Math.round(1000 * raddecCount /
                                      STATISTICS_INTERVAL_MILLISECONDS);
  numTransmitters.textContent = Object.keys(beaver.transmitters).length;
  raddecCount = 0;
}

// Update status
function updateStatus() {
  let statusUrl = baseUrl + STATUS_ROUTE;

  getUrl(statusUrl, function(status, response) {
    mem.textContent = Math.round(100 * response.status.memUseRatio);
    cpu.textContent = Math.round(100 * response.status.cpuLoadRatio);
  });
}

// GET the given URL
function getUrl(url, callback) {
  let httpRequest = new XMLHttpRequest();

  httpRequest.onreadystatechange = function() {
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      return callback(httpRequest.status,
                      JSON.parse(httpRequest.responseText));
    }
  };
  httpRequest.open('GET', url);
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send();
}

// Startup functions
updateStatus();

// Periodic functions
setInterval(updateStatistics, STATISTICS_INTERVAL_MILLISECONDS);
setInterval(updateStatus, STATUS_INTERVAL_MILLISECONDS);



