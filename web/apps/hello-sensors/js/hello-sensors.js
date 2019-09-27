/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const SORT_BY_OPTIONS = [
    '\u21e1 transmitterId',
    '\u21e3 transmitterId'
];

// DOM elements
let idFilter = document.querySelector('#idFilter');
let sortBy = document.querySelector('#sortBy');
let displayCount = document.querySelector('#displayCount');
let sensorCards = document.querySelector('#sensorCards');

// Create sortBy options
SORT_BY_OPTIONS.forEach(function(element, index) {
  let option = document.createElement('option');
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
  if(isSensor(raddec)) {
    updateDevice(raddec);
  }
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  if(isSensor(raddec)) {
    let card = document.getElementById(raddec.transmitterId);
    sensorCards.removeChild(card);
    delete devices[raddec.transmitterId];
    updateDisplayCount();
  }
});


// Determine if the given raddec is from a sensor device
function isSensor(raddec) {
  let foundSensorPacket = false;
  let hasPackets = (raddec.hasOwnProperty('packets') &&
                    (raddec.packets.length > 0));

  if(hasPackets) {
    raddec.packets.forEach(function(packet) {
      if(isSensorPacket(packet)) {
        foundSensorPacket = true;
      }
    });
  }

  return foundSensorPacket;
}


// Determine if the given packet is from a sensor device
function isSensorPacket(packet) {
  let isMinew = (packet.substr(26,4) === 'e1ff');
  if(isMinew) {
    let isTemperatureHumidity = (packet.substr(38,4) === 'a101');
    if(isTemperatureHumidity) {
      return true;
    }
  }
  return false;
}


// Update the sensor device
function updateDevice(raddec) {
  let card;
  let deviceId = raddec.transmitterId;
  let receiverId = raddec.rssiSignature[0].receiverId;
  let rssi = raddec.rssiSignature[0].rssi;
  let isNewSensor = !devices.hasOwnProperty(deviceId);

  if(isNewSensor) {
    devices[deviceId] = {};
    card = document.createElement('div');
    card.setAttribute('id', deviceId);
    card.setAttribute('class', 'card my-4');
    sensorCards.append(card);
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
    if(isSensorPacket(packet)) {
      devices[deviceId] = parseSensorPacket(packet);
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

  let numberOfSensors = Object.keys(devices[deviceId]).length;
  let widthClass;

  switch(numberOfSensors) {
    case 1:
      widthClass = 'col-md-12';
      break;
    case 2:
      widthClass = 'col-md-6';
      break;
    case 3:
      widthClass = 'col-md-4';
      break;
    case 4:
      widthClass = 'col-md-3';
      break;
    default:
      widthClass = 'col-md-2';
  }

  for(sensor in devices[deviceId]) {
    let reading = devices[deviceId][sensor];
    let sensorElement = createSensorElement(sensor, reading, widthClass);
    row.appendChild(sensorElement);
  }

  card.innerHTML = '';
  card.appendChild(updatedContent);
}


// Parse the given sensor packet, returning an Object with relevant fields
function parseSensorPacket(packet) {
  let sensor = {};

  let isMinew = (packet.substr(26,4) === 'e1ff');
  if(isMinew) {
    let isTemperatureHumidity = (packet.substr(38,4) === 'a101');
    if(isTemperatureHumidity) {
      sensor.temperature = (parseInt(packet.substr(44, 2), 16) +
                            parseInt(packet.substr(46, 2), 16) / 256).toFixed(1);
      sensor.humidity = (parseInt(packet.substr(48, 2), 16) +
                         parseInt(packet.substr(50, 2), 16) / 256).toFixed(1);
    }
  }

  return sensor;
}


// Create a sensor element based on the given sensor type and reading
function createSensorElement(sensor, reading, widthClass) {
  let element = document.createElement('div');
  let card = document.createElement('div');
  let header = document.createElement('h5');
  let body = document.createElement('div');
  let sensorIconClass;
  let sensorName;
  let sensorReading;

  element.setAttribute('class', widthClass);
  card.setAttribute('class', 'card');
  header.setAttribute('class', 'card-header text-white bg-dark');
  body.setAttribute('class', 'card-body text-center text-truncate display-4');

  switch(sensor) {
    case('temperature'):
      sensorIconClass = 'fas fa-thermometer-half';
      sensorName = 'Temperature';
      sensorReading = reading + '\u00b0C';
      break;
    case('humidity'):
      sensorIconClass = 'fas fa-water';
      sensorName = 'Humidity';
      sensorReading = reading + '%';
      break;
  }

  let headerIcon = document.createElement('i');
  headerIcon.setAttribute('class', sensorIconClass);
  header.appendChild(headerIcon);
  let headerText = document.createTextNode(' \u00a0 ' + sensorName);
  header.appendChild(headerText);

  let bodyText = document.createTextNode(sensorReading);
  body.appendChild(bodyText);

  card.appendChild(header);
  card.appendChild(body);
  element.appendChild(card);
  return element;
}


// Update display count
function updateDisplayCount() {
  let visibleCount = 0;
  let totalCount = Object.keys(devices).length;
  let cards = Array.from(sensorCards.children);

  cards.forEach(function(card) {
    if(!card.hidden) {
      visibleCount++;
    }
  });
  displayCount.value = visibleCount + ' of ' + totalCount;
}


// Sort the sensor cards
function sortCards() {
  let cards = Array.from(sensorCards.children);
  let sortedFragment = document.createDocumentFragment();

  cards.sort(sortFunction);

  cards.forEach(function(card) {
    sortedFragment.appendChild(card);
  });

  sensorCards.innerHTML = '';
  sensorCards.appendChild(sortedFragment);
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
  let cards = Array.from(sensorCards.children);

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
