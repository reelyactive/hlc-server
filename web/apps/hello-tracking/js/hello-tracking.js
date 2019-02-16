/**
 * Copyright reelyActive 2018-2019
 * We believe in an open Internet of Things
 */


// Constants
const SORT_BY_OPTIONS = [
    '\u21e1 transmitterId',
    '\u21e3 transmitterId',
    '\u21e1 rssi',
    '\u21e3 rssi'
];

// DOM elements
let idFilter = document.querySelector('#idFilter');
let sortBy = document.querySelector('#sortBy');
let raddecs = document.querySelector('#raddecs');
let tbody = raddecs.querySelector('tbody');

// Create sortBy options
SORT_BY_OPTIONS.forEach(function(element, index) {
  let option = document.createElement("option");
  option.value = index;
  option.text = element;
  sortBy.add(option, null);
});

// Other variables
let sortByFunction;
updateSortFunction();

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  let tr = document.getElementById(raddec.transmitterId);
  if(tr) {
    updateRaddec(raddec, tr);
  }
  else {
    insertRaddec(raddec, true);
  }
  sortRaddecs();
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  let tr = document.getElementById(raddec.transmitterId);
  if(tr) {
    tr.remove();
  }
});

// Update an existing raddec in the DOM
function updateRaddec(raddec, tr) {
  let tds = tr.getElementsByTagName('td');
  tds[1].textContent = raddec.events;
  tds[2].textContent = raddec.rssiSignature[0].receiverId;
  tds[3].textContent = raddec.rssiSignature[0].rssi;
  tds[4].textContent = prepareRecDecPac(raddec);
  tds[5].textContent = new Date(raddec.timestamp).toLocaleTimeString();

  updateVisibility(tr, [ tds[0].textContent, tds[2].textContent ]);
}

// Insert a raddec into the DOM as a <tr>
function insertRaddec(raddec, prepend) {
  let tr = document.createElement('tr');
  tr.setAttribute('id', raddec.transmitterId);
  tr.setAttribute('class', 'monospace');

  appendTd(tr, raddec.transmitterId, 'text-right');
  appendTd(tr, raddec.events, 'text-center');
  appendTd(tr, raddec.rssiSignature[0].receiverId, 'text-right');
  appendTd(tr, raddec.rssiSignature[0].rssi, 'text-right');
  appendTd(tr, prepareRecDecPac(raddec), 'text-center');
  appendTd(tr, new Date(raddec.timestamp).toLocaleTimeString(), 'text-center');

  updateVisibility(tr, [ raddec.transmitterId,
                         raddec.rssiSignature[0].receiverId ]);
  tbody.prepend(tr);
}

// Append a <td> with the given content to the given <tr>
function appendTd(tr, text, classNames) {
  let td = document.createElement('td');
  let cell = document.createTextNode(text);
  td.appendChild(cell);
  tr.appendChild(td);
  if(classNames) {
    td.setAttribute('class', classNames);
  }
}

// Prepare the receivers-decodings-packets string
function prepareRecDecPac(raddec) {
  let maxNumberOfDecodings = 0;

  raddec.rssiSignature.forEach(function(signature) {
    if(signature.numberOfDecodings > maxNumberOfDecodings) {
      maxNumberOfDecodings = signature.numberOfDecodings;
    }
  });

  return raddec.rssiSignature.length + ' / ' + maxNumberOfDecodings + ' / ' +
         raddec.packets.length;
}

// Display/hide row based on ID filter
function updateVisibility(tr, ids) {
  let display = 'none';
  ids.forEach(function(id) {
    if(id.includes(idFilter.value)) {
      display = '';
    }
  });
  tr.style.display = display;
}

// Sort the raddecs in the table
function sortRaddecs() {
  let trs = Array.from(tbody.getElementsByTagName('tr'));

  trs.sort(sortByFunction);

  trs.forEach(function(tr) {
    tbody.appendChild(tr);
  });
}

function updateSortFunction() {
  switch(sortBy.value) {
    case '0': // transmitterId increasing
      sortByFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[0].textContent <
           tr2.getElementsByTagName('td')[0].textContent) {
          return -1;
        };
        return 1;
      }
      break;
    case '1': // transmitterId decreasing
      sortByFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[0].textContent >
           tr2.getElementsByTagName('td')[0].textContent) {
          return -1;
        };
        return 1;
      }
      break;
    case '2': // rssi increasing
      sortByFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[3].textContent <
           tr2.getElementsByTagName('td')[3].textContent) {
          return -1;
        };
        return 1;
      }
      break;
    case '3': // rssi decreasing
      sortByFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[3].textContent <
           tr2.getElementsByTagName('td')[3].textContent) {
          return -1;
        };
        return 1;
      }
      break;
  }
  sortRaddecs();
}

// Handle ID filter changes
idFilter.addEventListener('keyup', function() {
  let trs = tbody.getElementsByTagName('tr');
  for(let tr of trs) {
    let tds = tr.getElementsByTagName('td');
    updateVisibility(tr, [ tds[0].textContent, tds[2].textContent ]);
  }
});

// Handle sortBy changes
sortBy.addEventListener('change', updateSortFunction);
