/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// DOM elements
let mem = document.querySelector('#mem');
let cpu = document.querySelector('#cpu');
let jsonResponse = document.querySelector('#jsonResponse');


// Initialisation: GET the status and display in DOM
getStatus(window.location.href, function(status, response) {
  jsonResponse.textContent = JSON.stringify(response, null, 2);
  // TODO: handle the case of Not Found and Bad Request
  mem.textContent = Math.round(100 * response.status.memUseRatio) + '%';
  cpu.textContent = Math.round(100 * response.status.cpuLoadRatio) + '%';
});


// GET the associations
function getStatus(url, callback) {
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
