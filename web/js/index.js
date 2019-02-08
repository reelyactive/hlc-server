/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const STATISTICS_INTERVAL_MILLISECONDS = 1000;

// DOM elements
let raddecRate = document.querySelector('#raddecRate');
let numTransmitters = document.querySelector('#numTransmitters');

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

// Periodic functions
setInterval(updateStatistics, STATISTICS_INTERVAL_MILLISECONDS);



