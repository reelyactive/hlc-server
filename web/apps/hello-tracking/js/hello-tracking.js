/**
 * Copyright reelyActive 2018-2019
 * We believe in an open Internet of Things
 */


// Constants
const SORT_BY_OPTIONS = [
    '\u21e1 transmitterId',
    '\u21e3 transmitterId',
    '\u21e1 receiverId',
    '\u21e3 receiverId',
    '\u21e1 rssi',
    '\u21e3 rssi',
    '\u21e1 numberOfReceivers',
    '\u21e3 numberOfReceivers',
    '\u21e1 numberOfDecodings',
    '\u21e3 numberOfDecodings',
    '\u21e1 numberOfPackets',
    '\u21e3 numberOfPackets'
];
const RDPS = ' / ';
const EVENT_ICONS = [
    'fas fa-sign-in-alt',
    'fas fa-route',
    'fas fa-info',
    'fas fa-heartbeat',
    'fas fa-sign-out-alt'
];

// DOM elements
let idFilter = document.querySelector('#idFilter');
let sortBy = document.querySelector('#sortBy');
let displayCount = document.querySelector('#displayCount');
let raddecs = document.querySelector('#raddecs');
let tbody = raddecs.querySelector('tbody');

// Create sortBy options
SORT_BY_OPTIONS.forEach(function(element, index) {
  let option = document.createElement('option');
  option.value = index;
  option.text = element;
  sortBy.add(option, null);
});

// Other variables
let sortFunction;
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
  sortRaddecsAndHighlight(raddec.transmitterId);
  updateDisplayCount();
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  let tr = document.getElementById(raddec.transmitterId);
  if(tr) {
    tr.remove();
    updateDisplayCount();
  }
});

// Update an existing raddec in the DOM
function updateRaddec(raddec, tr) {
  let tds = tr.getElementsByTagName('td');
  updateNode(tds[1], prepareEvents(raddec));
  updateNode(tds[2], raddec.rssiSignature[0].receiverId);
  updateNode(tds[3], raddec.rssiSignature[0].rssi);
  updateNode(tds[4], prepareRecDecPac(raddec));
  updateNode(tds[5], new Date(raddec.timestamp).toLocaleTimeString());
  updateVisibility(tr, [ tds[0].textContent, tds[2].textContent ]);
}

// Insert a raddec into the DOM as a <tr>
function insertRaddec(raddec, prepend) {
  let tr = document.createElement('tr');
  tr.setAttribute('id', raddec.transmitterId);
  tr.setAttribute('class', 'monospace');

  appendTd(tr, raddec.transmitterId, 'text-right');
  appendTd(tr, prepareEvents(raddec), 'text-center');
  appendTd(tr, raddec.rssiSignature[0].receiverId, 'text-right');
  appendTd(tr, raddec.rssiSignature[0].rssi, 'text-right');
  appendTd(tr, prepareRecDecPac(raddec), 'text-center');
  appendTd(tr, new Date(raddec.timestamp).toLocaleTimeString(), 'text-center');

  updateVisibility(tr, [ raddec.transmitterId,
                         raddec.rssiSignature[0].receiverId ]);
  tbody.prepend(tr);
}

// Append a <td> with the given content to the given <tr>
function appendTd(tr, content, classNames) {
  let td = document.createElement('td');
  updateNode(td, content);
  tr.appendChild(td);
  if(classNames) {
    td.setAttribute('class', classNames);
  }
}

// Update the given node with the given content
function updateNode(node, content, append) {
  append = append || false;

  while(!append && node.firstChild) {
    node.removeChild(node.firstChild);
  }

  if(content instanceof Element) {
    node.appendChild(content);
  }
  else if(content instanceof Array) {
    content.forEach(function(element) {
      node.appendChild(element);
    });
  }
  else {
    node.textContent = content;
  }
}

// Prepare the event icons
function prepareEvents(raddec) {
  let elements = [];

  raddec.events.forEach(function(event) {
    let i = document.createElement('i');
    let space = document.createTextNode(' ');
    i.setAttribute('class', EVENT_ICONS[event]);
    elements.push(i);
    elements.push(space);
  });

  return elements;
}

// Prepare the receivers-decodings-packets string
function prepareRecDecPac(raddec) {
  let maxNumberOfDecodings = 0;

  raddec.rssiSignature.forEach(function(signature) {
    if(signature.numberOfDecodings > maxNumberOfDecodings) {
      maxNumberOfDecodings = signature.numberOfDecodings;
    }
  });

  return raddec.rssiSignature.length + RDPS + maxNumberOfDecodings + RDPS +
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

// Update display count
function updateDisplayCount() {
  let visibleCount = 0;
  let totalCount = Object.keys(beaver.transmitters).length;
  let trs = Array.from(tbody.getElementsByTagName('tr'));

  trs.forEach(function(tr) {
    if(tr.style.display === '') {
      visibleCount++;
    }
  });
  displayCount.value = visibleCount + ' of ' + totalCount;
}

// Sort the raddecs in the table, highlighting the given transmitterId
function sortRaddecsAndHighlight(transmitterId) {
  let trs = Array.from(tbody.getElementsByTagName('tr'));
  let sortedFragment = document.createDocumentFragment();

  trs.sort(sortFunction);

  trs.forEach(function(tr) {
    if(tr.id === transmitterId) {
      tr.setAttribute('class', 'monospace animated-highlight-reelyactive');
    }
    else {
      tr.setAttribute('class', 'monospace');
    }
    sortedFragment.appendChild(tr);
  });

  tbody.appendChild(sortedFragment);
}

// Update the sort function based on the user selection
function updateSortFunction() {
  switch(sortBy.value) {
    case '0': // transmitterId increasing
      sortFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[0].textContent <
           tr2.getElementsByTagName('td')[0].textContent) {
          return -1;
        };
        return 1;
      }
      break;
    case '1': // transmitterId decreasing
      sortFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[0].textContent >
           tr2.getElementsByTagName('td')[0].textContent) {
          return -1;
        };
        return 1;
      }
      break;
    case '2': // receiverId increasing
      sortFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[2].textContent <
           tr2.getElementsByTagName('td')[2].textContent) {
          return -1;
        };
        return 1;
      }
      break;
    case '3': // receiverId decreasing
      sortFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[2].textContent >
           tr2.getElementsByTagName('td')[2].textContent) {
          return -1;
        };
        return 1;
      }
      break;
    case '4': // rssi increasing
      sortFunction = function(tr1, tr2) {
        if(parseInt(tr1.getElementsByTagName('td')[3].textContent) <
           parseInt(tr2.getElementsByTagName('td')[3].textContent)) {
          return -1;
        };
        return 1;
      }
      break;
    case '5': // rssi decreasing
      sortFunction = function(tr1, tr2) {
        if(parseInt(tr1.getElementsByTagName('td')[3].textContent) >
           parseInt(tr2.getElementsByTagName('td')[3].textContent)) {
          return -1;
        };
        return 1;
      }
      break;
    case '6': // numberOfReceivers increasing
      sortFunction = function(tr1, tr2) {
        if(parseInt(tr1.getElementsByTagName('td')[4].textContent.split(RDPS)[0]) <
           parseInt(tr2.getElementsByTagName('td')[4].textContent.split(RDPS)[0])) {
          return -1;
        };
        return 1;
      }
      break;
    case '7': // numberOfReceivers decreasing
      sortFunction = function(tr1, tr2) {
        if(parseInt(tr1.getElementsByTagName('td')[4].textContent.split(RDPS)[0]) >
           parseInt(tr2.getElementsByTagName('td')[4].textContent.split(RDPS)[0])) {
          return -1;
        };
        return 1;
      }
      break;
    case '8': // numberOfDecodings increasing
      sortFunction = function(tr1, tr2) {
        if(parseInt(tr1.getElementsByTagName('td')[4].textContent.split(RDPS)[1]) <
           parseInt(tr2.getElementsByTagName('td')[4].textContent.split(RDPS)[1])) {
          return -1;
        };
        return 1;
      }
      break;
    case '9': // numberOfDecodings decreasing
      sortFunction = function(tr1, tr2) {
        if(parseInt(tr1.getElementsByTagName('td')[4].textContent.split(RDPS)[1]) >
           parseInt(tr2.getElementsByTagName('td')[4].textContent.split(RDPS)[1])) {
          return -1;
        };
        return 1;
      }
      break;
    case '10': // numberOfPackets increasing
      sortFunction = function(tr1, tr2) {
        if(parseInt(tr1.getElementsByTagName('td')[4].textContent.split(RDPS)[2]) <
           parseInt(tr2.getElementsByTagName('td')[4].textContent.split(RDPS)[2])) {
          return -1;
        };
        return 1;
      }
      break;
    case '11': // numberOfPackets decreasing
      sortFunction = function(tr1, tr2) {
        if(parseInt(tr1.getElementsByTagName('td')[4].textContent.split(RDPS)[2]) >
           parseInt(tr2.getElementsByTagName('td')[4].textContent.split(RDPS)[2])) {
          return -1;
        };
        return 1;
      }
      break;
  }
  sortRaddecsAndHighlight();
}

// Handle ID filter changes
idFilter.addEventListener('keyup', function() {
  let trs = tbody.getElementsByTagName('tr');
  for(let tr of trs) {
    let tds = tr.getElementsByTagName('td');
    updateVisibility(tr, [ tds[0].textContent, tds[2].textContent ]);
  }
  updateDisplayCount();
});

// Handle sortBy changes
sortBy.addEventListener('change', updateSortFunction);
