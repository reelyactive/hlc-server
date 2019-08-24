/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const SORT_BY_OPTIONS = [
    '\u21e1 transmitterId',
    '\u21e3 transmitterId'
];
const SIGNATURE_SEPARATOR = '/';
const DIRACT_PACKET_SIGNATURE = 'ff830501';
const DIRACT_PACKET_SIGNATURE_OFFSET = 24;

// DOM elements
let idFilter = document.querySelector('#idFilter');
let sortBy = document.querySelector('#sortBy');
let displayCount = document.querySelector('#displayCount');
let diractCards = document.querySelector('#diractCards');

// Create sortBy options
SORT_BY_OPTIONS.forEach(function(element, index) {
  let option = document.createElement("option");
  option.value = index;
  option.text = element;
  sortBy.add(option, null);
});

// Other variables
let devices = {};
let sortFunction;
updateSortFunction();

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  if(isDirAct(raddec)) {
    updateDevice(raddec);
  }
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  if(isDirAct(raddec)) {
    delete devices[raddec.transmitterId];
    updateDisplayCount();
  }
});


// Determine if the given raddec is from a DirAct device
function isDirAct(raddec) {
  let foundDirActPacket = false;
  let hasPackets = (raddec.hasOwnProperty('packets') &&
                    (raddec.packets.length > 0));

  if(hasPackets) {
    raddec.packets.forEach(function(packet) {
      let signature = packet.substr(DIRACT_PACKET_SIGNATURE_OFFSET,
                                    DIRACT_PACKET_SIGNATURE.length);
      if(signature === DIRACT_PACKET_SIGNATURE) {
        foundDirActPacket = true;
      }
    });
  }

  return foundDirActPacket;
}


// Update the DirAct device
function updateDevice(raddec) {
  let card;
  let deviceId = raddec.transmitterId;
  let receiverId = raddec.rssiSignature[0].receiverId;
  let rssi = raddec.rssiSignature[0].rssi;
  let isNewDirAct = !devices.hasOwnProperty(deviceId);

  if(isNewDirAct) {
    devices[deviceId] = {};
    card = document.createElement('div');
    card.setAttribute('id', deviceId);
    card.setAttribute('class', 'card my-4');
    diractCards.append(card);
    if(!deviceId.includes(idFilter.value)) {
      card.hidden = true;
    }
    updateDisplayCount();
    sortCards();
  }
  else {
    card = document.getElementById(deviceId);
  }

  raddec.packets.forEach(function(packet) {
    let signature = packet.substr(DIRACT_PACKET_SIGNATURE_OFFSET,
                                  DIRACT_PACKET_SIGNATURE.length);
    if(signature === DIRACT_PACKET_SIGNATURE) {
      devices[deviceId] = parseDirActPacket(packet);
    }
  });

  updateCard(card, deviceId, receiverId, rssi);
}


// Updare the card contents in the DOM
function updateCard(card, deviceId, receiverId, rssi) {
  let updatedContent = document.createDocumentFragment();
  let body = document.createElement('div');
  body.setAttribute('class', 'card-body');
  updatedContent.appendChild(body);

  let title = document.createElement('h5');
  title.setAttribute('class', 'card-title monospace');
  body.appendChild(title);

  let barcodeIcon = document.createElement('i');
  barcodeIcon.setAttribute('class', 'fas fa-barcode');
  title.appendChild(barcodeIcon);

  let transmitter = document.createTextNode('\u00a0' + deviceId);
  title.appendChild(transmitter);

  let subtitle = document.createElement('h6');
  subtitle.setAttribute('class', 'card-subtitle mb-4 text-muted monospace');
  body.appendChild(subtitle);

  let receiverIcon = document.createElement('i');
  receiverIcon.setAttribute('class', 'fas fa-map-pin');
  subtitle.appendChild(receiverIcon);

  let receiver = document.createTextNode('\u00a0' + receiverId + '\u00a0');
  subtitle.appendChild(receiver);

  let rssiIcon = document.createElement('i');
  rssiIcon.setAttribute('class', 'fas fa-signal');
  subtitle.appendChild(rssiIcon);

  let rssiValue = document.createTextNode('\u00a0' + rssi + ' dBm');
  subtitle.appendChild(rssiValue);

  let row = document.createElement('div');
  row.setAttribute('class', 'row');
  body.appendChild(row);

  let dataCol = document.createElement('div');
  dataCol.setAttribute('class', 'col-md-6');
  createDataTable(dataCol, devices[deviceId]);
  row.appendChild(dataCol);

  let nearestCol = document.createElement('div');
  nearestCol.setAttribute('class', 'col-md-6');
  createNearestTable(nearestCol, devices[deviceId]);
  row.appendChild(nearestCol);

  card.innerHTML = '';
  card.appendChild(updatedContent);
}


// Create the data table for the given device
function createDataTable(node, device) {
  let table = document.createElement('table');
  table.setAttribute('class', 'table table-sm table-hover');
  node.appendChild(table);

  let thead = document.createElement('thead');
  thead.setAttribute('class', 'thead-reelyactive');
  table.appendChild(thead);

  let tbody = document.createElement('tbody');
  table.appendChild(tbody);

  let tr = document.createElement('tr');
  tr.setAttribute('class', 'text-center');
  thead.appendChild(tr);

  let th = document.createElement('th');
  th.setAttribute('colspan', 2);
  th.textContent = 'Properties';
  tr.appendChild(th);

  tr = document.createElement('tr');
  tbody.appendChild(tr);

  th = document.createElement('th');
  tr.appendChild(th);

  let td = document.createElement('td');
  td.setAttribute('class', 'monospace');
  tr.appendChild(td);

  let instanceIcon = document.createElement('i');
  instanceIcon.setAttribute('class', 'fas fa-barcode');
  th.appendChild(instanceIcon);

  let instanceTitle = document.createTextNode('\u00a0 instance');
  th.appendChild(instanceTitle);

  let instance = document.createTextNode(device.instanceId);
  td.appendChild(instance);

  tr = document.createElement('tr');
  tbody.appendChild(tr);

  th = document.createElement('th');
  tr.appendChild(th);

  td = document.createElement('td');
  td.setAttribute('class', 'monospace');
  tr.appendChild(td);

  let accelerationIcon = document.createElement('i');
  accelerationIcon.setAttribute('class', 'fas fa-rocket');
  th.appendChild(accelerationIcon);

  let accelerationTitle = document.createTextNode('\u00a0 acceleration (g)');
  th.appendChild(accelerationTitle);

  let acceleration = document.createTextNode(device.acceleration);
  td.appendChild(acceleration);

  tr = document.createElement('tr');
  tbody.appendChild(tr);

  th = document.createElement('th');
  tr.appendChild(th);

  td = document.createElement('td');
  td.setAttribute('class', 'monospace');
  tr.appendChild(td);

  let batteryIcon = document.createElement('i');
  batteryIcon.setAttribute('class', 'fas fa-battery-half');
  th.appendChild(batteryIcon);

  let batteryTitle = document.createTextNode('\u00a0 battery');
  th.appendChild(batteryTitle);

  let battery = document.createTextNode(device.batteryPercentage + '%');
  td.appendChild(battery);
}


// Create the nearest table for the given device
function createNearestTable(node, device) {
  let table = document.createElement('table');
  table.setAttribute('class', 'table table-sm table-hover');
  node.appendChild(table);

  let thead = document.createElement('thead');
  thead.setAttribute('class', 'thead-reelyactive');
  table.appendChild(thead);

  let tbody = document.createElement('tbody');
  table.appendChild(tbody);

  let tr = document.createElement('tr');
  tr.setAttribute('class', 'text-center');
  thead.appendChild(tr);

  let th = document.createElement('th');
  th.setAttribute('colspan', 2);
  th.textContent = 'Nearest';
  tr.appendChild(th);

  device.nearest.forEach(function(beacon) {
    tr = document.createElement('tr');
    tbody.appendChild(tr);

    th = document.createElement('th');
    th.setAttribute('class', 'monospace');
    tr.appendChild(th);

    let td = document.createElement('td');
    td.setAttribute('class', 'monospace');
    tr.appendChild(td);

    let instanceIcon = document.createElement('i');
    instanceIcon.setAttribute('class', 'fas fa-barcode');
    th.appendChild(instanceIcon);

    let instance = document.createTextNode('\u00a0' + beacon.instanceId);
    th.appendChild(instance);

    let rssiIcon = document.createElement('i');
    rssiIcon.setAttribute('class', 'fas fa-signal');
    td.appendChild(rssiIcon);

    let rssi = document.createTextNode('\u00a0' + beacon.rssi + ' dBm');
    td.appendChild(rssi);
  });

}


// Parse the given DirAct packet, returning an Object with relevant fields
function parseDirActPacket(packet) {
  let diract = {};
  let data = packet.substr(30);
  let frameLength = parseInt(data.substr(2,2), 16) & 0x1f;

  diract.cyclicCount = parseInt(data.substr(2,1), 16) >> 1;
  diract.instanceId = data.substr(4,8);
  diract.acceleration = [];
  diract.acceleration.push(toAcceleration(data.substr(12,2), true));
  diract.acceleration.push(toAcceleration(data.substr(13,2), false));
  diract.acceleration.push(toAcceleration(data.substr(15,2), true));
  diract.batteryPercentage = toBatteryPercentage(data.substr(16,2));
  diract.nearest = [];

  for(nearestIndex = 9; nearestIndex < (frameLength + 2); nearestIndex += 5) {
    let instanceId = data.substr(nearestIndex * 2, 8);
    let rssi = toRssi(data.substr(nearestIndex * 2 + 8, 2));
    diract.nearest.push( { instanceId: instanceId, rssi: rssi } );
  }

  return diract;
}


// Convert the given bytes to battery percentage.
function toBatteryPercentage(bits) {
  var data = parseInt(bits, 16);
  data &= 0x3f;

  return Math.round(100 * data / 63);
}


// Convert the given twos complement hexadecimal string to acceleration in g.
function toAcceleration(byte, isUpper) {
  var data = parseInt(byte, 16);
  if(isUpper) {
    data = data >> 2;
  }
  else {
    data &= 0x3f;
  }
  if(data === 32) {
    return null;
  }
  if(data > 31) {
    return (data - 64) / 16;
  }
  return data / 16;
}


// Convert the given byte to RSSI.
function toRssi(bits) {
  var data = parseInt(bits, 16);

  return (data & 0x3f) - 92;
}


// Update display count
function updateDisplayCount() {
  let visibleCount = 0;
  let totalCount = Object.keys(devices).length;
  let cards = Array.from(diractCards.children);

  cards.forEach(function(card) {
    if(!card.hidden) {
      visibleCount++;
    }
  });
  displayCount.value = visibleCount + ' of ' + totalCount;
}


// Sort the DirAct cards
function sortCards() {
  let cards = Array.from(diractCards.children);
  let sortedFragment = document.createDocumentFragment();

  cards.sort(sortFunction);

  cards.forEach(function(card) {
    sortedFragment.appendChild(card);
  });

  diractCards.innerHTML = '';
  diractCards.appendChild(sortedFragment);
}


// Update the sort function based on the user selection
function updateSortFunction() {
  switch(sortBy.value) {
    case '0': // transmitterId increasing
      sortFunction = function(card1, card2) {
        if(parseInt(card1.id, 16) < parseInt(card2.id, 16)) {
          return -1;
        };
        return 1;
      }
      break;
    case '1': // transmitterId decreasing
      sortFunction = function(card1, card2) {
        if(parseInt(card1.id, 16) > parseInt(card2.id, 16)) {
          return -1;
        };
        return 1;
      }
      break;
  }
  sortCards();
}


// Handle ID filter changes
idFilter.addEventListener('keyup', function() {
  let cards = Array.from(diractCards.children);

  cards.forEach(function(card) {
    if(card.id.includes(idFilter.value)) {
      card.hidden = false;
    }
    else {
      card.hidden = true;
    }
  });

  updateDisplayCount();
});

// Handle sortBy changes
sortBy.addEventListener('change', updateSortFunction);
