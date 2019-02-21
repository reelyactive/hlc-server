/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const SORT_BY_OPTIONS = [
    '\u21e1 receiverId',
    '\u21e3 receiverId'
];
const SIGNATURE_SEPARATOR = '/';

// DOM elements
let idFilter = document.querySelector('#idFilter');
let sortBy = document.querySelector('#sortBy');
let displayCount = document.querySelector('#displayCount');
let receiverTable = document.querySelector('#receiverTable');
let tbody = receiverTable.querySelector('tbody');

// Create sortBy options
SORT_BY_OPTIONS.forEach(function(element, index) {
  let option = document.createElement("option");
  option.value = index;
  option.text = element;
  sortBy.add(option, null);
});

// Other variables
let receivers = {};
let sortFunction;
updateSortFunction();

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  let isUnknownReceiverType = (raddec.rssiSignature[0].receiverIdType === 0);
  if(isUnknownReceiverType) {
    return;
  }

  let receiverSignature = getReceiverSignature(raddec);
  let isKnownReceiver = receivers.hasOwnProperty(receiverSignature);

  if(isKnownReceiver) {
    updateReceiver(receiverSignature, raddec);
  }
  else {
    insertReceiver(receiverSignature, raddec);
  }

  sortReceiversAndHighlight(receiverSignature);
  updateDisplayCount();
});

// Get the given raddec's strongest receiver signature
function getReceiverSignature(raddec) {
  return raddec.rssiSignature[0].receiverId + SIGNATURE_SEPARATOR +
         raddec.rssiSignature[0].receiverIdType;
}

// Update an existing raddec in the DOM
function updateReceiver(receiverSignature, raddec) {
  let tr = document.getElementById(receiverSignature);
  let tds = tr.getElementsByTagName('td');
  tds[2].textContent = new Date(raddec.timestamp).toLocaleTimeString();

  updateVisibility(tr, [ tds[0].textContent ]);
}

// Insert a receiver into the DOM as a <tr>
function insertReceiver(receiverSignature, raddec) {
  let tr = document.createElement('tr');
  tr.setAttribute('id', receiverSignature);
  tr.setAttribute('class', 'monospace');

  appendTd(tr, raddec.rssiSignature[0].receiverId, 'text-right');
  appendTd(tr, raddec.rssiSignature[0].receiverIdType, 'text-center');
  appendTd(tr, new Date(raddec.timestamp).toLocaleTimeString(), 'text-center');

  updateVisibility(tr, [ raddec.rssiSignature[0].receiverId ]);
  tbody.prepend(tr);
  receivers[receiverSignature] = {};
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
  let totalCount = Object.keys(receivers).length;
  let trs = Array.from(tbody.getElementsByTagName('tr'));

  trs.forEach(function(tr) {
    if(tr.style.display === '') {
      visibleCount++;
    }
  });
  displayCount.value = visibleCount + ' of ' + totalCount;
}

// Sort the receivers in the table, highlighting the given receiver
function sortReceiversAndHighlight(receiverSignature) {
  let trs = Array.from(tbody.getElementsByTagName('tr'));
  let sortedFragment = document.createDocumentFragment();

  trs.sort(sortFunction);

  trs.forEach(function(tr) {
    if(tr.id === receiverSignature) {
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
    case '0': // receiverId increasing
      sortFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[0].textContent <
           tr2.getElementsByTagName('td')[0].textContent) {
          return -1;
        };
        return 1;
      }
      break;
    case '1': // receiverId decreasing
      sortFunction = function(tr1, tr2) {
        if(tr1.getElementsByTagName('td')[0].textContent >
           tr2.getElementsByTagName('td')[0].textContent) {
          return -1;
        };
        return 1;
      }
      break;
  }
  sortReceiversAndHighlight();
}

// Handle ID filter changes
idFilter.addEventListener('keyup', function() {
  let trs = tbody.getElementsByTagName('tr');
  for(let tr of trs) {
    let tds = tr.getElementsByTagName('td');
    updateVisibility(tr, [ tds[0].textContent ]);
  }
});

// Handle sortBy changes
sortBy.addEventListener('change', updateSortFunction);
