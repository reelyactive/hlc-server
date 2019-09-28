/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const SORT_BY_OPTIONS = [
    '\u21e1 transmitterId',
    '\u21e3 transmitterId'
];
const AXIS_NAMES = [ 'x', 'y', 'z' ];

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
  let isCodeBlue = (packet.substr(24,6) === 'ff8305');
  if(isMinew) {
    let isTemperatureHumidity = (packet.substr(38,4) === 'a101');
    let isVisibleLight = (packet.substr(38,4) === 'a102');
    let isAcceleration = (packet.substr(38,4) === 'a103');
    if(isTemperatureHumidity || isVisibleLight || isAcceleration) {
      return true;
    }
  }
  if(isCodeBlue) {
    let isPuckyActive = (packet.substr(30,2) === '02');
    return isPuckyActive;
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
  let isCodeBlue = (packet.substr(24,6) === 'ff8305');

  if(isMinew) {
    let isTemperatureHumidity = (packet.substr(38,4) === 'a101');
    let isVisibleLight = (packet.substr(38,4) === 'a102');
    let isAcceleration = (packet.substr(38,4) === 'a103');

    if(isTemperatureHumidity) {
      sensor.temperature = (parseInt(packet.substr(44, 2), 16) +
                            parseInt(packet.substr(46, 2), 16) / 256).toFixed(1);
      sensor.humidity = (parseInt(packet.substr(48, 2), 16) +
                         parseInt(packet.substr(50, 2), 16) / 256).toFixed(1);
    }
    else if(isVisibleLight) {
      sensor.visibleLight = (packet.substr(44, 2) === '01');
    }
    else if(isAcceleration) {
      sensor.acceleration = [];
      sensor.accelerationMagnitude = 0;
      sensor.acceleration.push(fixedPointToDecimal(packet.substr(44, 4)));
      sensor.acceleration.push(fixedPointToDecimal(packet.substr(48, 4)));
      sensor.acceleration.push(fixedPointToDecimal(packet.substr(52, 4)));
      sensor.acceleration.forEach(function(magnitude, index) {
        sensor.accelerationMagnitude += (magnitude * magnitude);
        sensor.acceleration[index] = magnitude.toFixed(2);
      });
      sensor.accelerationMagnitude = Math.sqrt(sensor.accelerationMagnitude)
                                         .toFixed(2);
    }
  }
  else if(isCodeBlue) {
    let isPuckyActive = (packet.substr(30,2) === '02');

    if(isPuckyActive) {
      sensor.temperature = ((parseInt(packet.substr(38,2), 16) / 2) - 40)
                           .toFixed(1);
      sensor.lightPercentage = Math.round((100 / 0xff) * 
                                          parseInt(packet.substr(40,2), 16));
      sensor.capSensePercentage = Math.round((100 / 0xff) * 
                                             parseInt(packet.substr(42,2), 16));
      sensor.magneticField = [];
      sensor.magneticField.push(toMagneticField(packet.substr(44,4)));
      sensor.magneticField.push(toMagneticField(packet.substr(48,4)));
      sensor.magneticField.push(toMagneticField(packet.substr(52,4)));
    }
  }

  return sensor;
}


// Convert the given signed 8.8 fixed-point hexadecimal string to decimal
function fixedPointToDecimal(word) {
  let integer = parseInt(word.substr(0,2),16);
  let decimal = parseInt(word.substr(2,2),16) / 256;

  if(integer > 127) {
    return ((integer - 256) + decimal);
  }
  return (integer + decimal);
}


// Convert the 16-bit word to signed magnetic field
function toMagneticField(bytes) {
  let upper = parseInt(bytes.substr(0,2), 16);
  let lower = parseInt(bytes.substr(2,2), 16);

  if(upper > 127) {
    upper = upper - 256;
  }

  return (upper * 256) + lower;
}


// Create a sensor element based on the given sensor type and reading
function createSensorElement(sensor, reading, widthClass) {
  let element = document.createElement('div');
  let card = document.createElement('div');
  let header = document.createElement('h5');
  let body = document.createElement('div');
  let sensorIconClass;
  let sensorName;
  let sensorContent;

  element.setAttribute('class', widthClass);
  card.setAttribute('class', 'card');
  header.setAttribute('class', 'card-header text-truncate text-white bg-dark');
  body.setAttribute('class', 'card-body text-center text-truncate display-4');

  switch(sensor) {
    case('temperature'):
      sensorIconClass = 'fas fa-thermometer-half';
      sensorName = 'Temperature';
      sensorContent = document.createTextNode(reading + '\u00b0C');
      break;
    case('humidity'):
      sensorIconClass = 'fas fa-water';
      sensorName = 'Humidity';
      sensorContent = document.createTextNode(reading + '%');
      break;
    case('visibleLight'):
      sensorIconClass = 'fas fa-lightbulb';
      sensorName = 'Visible Light?';
      sensorContent = document.createTextNode(reading);
      break;
    case('lightPercentage'):
      sensorIconClass = 'fas fa-lightbulb';
      sensorName = 'Light Percentage';
      sensorContent = document.createTextNode(reading + '%');
      break;
    case('acceleration'):
      sensorIconClass = 'fas fa-rocket';
      sensorName = 'Acceleration';
      sensorContent = createMagnitudeDisplay(reading, 2);
      break;
    case('accelerationMagnitude'):
      sensorIconClass = 'fas fa-rocket';
      sensorName = 'Acceleration Magnitude';
      sensorContent = document.createTextNode(reading + 'g');
      break;
    case('capSensePercentage'):
      sensorIconClass = 'fas fa-hand-pointer';
      sensorName = 'Capacitive Sense';
      sensorContent = document.createTextNode(reading + '%');
      break;
    case('magneticField'):
      sensorIconClass = 'fas fa-magnet';
      sensorName = 'Magnetic Field';
      sensorContent = createMagnitudeDisplay(reading, 32768);
      break;
  }

  let headerIcon = document.createElement('i');
  headerIcon.setAttribute('class', sensorIconClass);
  header.appendChild(headerIcon);
  let headerText = document.createTextNode(' \u00a0 ' + sensorName);
  header.appendChild(headerText);
  body.appendChild(sensorContent);

  card.appendChild(header);
  card.appendChild(body);
  element.appendChild(card);
  return element;
}


// Create a magnitude display element based on the given readings
function createMagnitudeDisplay(readings, maxMagnitude) {
  let element = document.createElement('div');

  readings.forEach(function(reading, index) {
    let posWidth = 0;
    let negWidth = 0;
    let axisName = AXIS_NAMES[index];

    if(reading >= 0) {
      posWidth = Math.min(100, (reading / maxMagnitude) * 100);
    }
    else {
      negWidth = Math.min(100, (Math.abs(reading) / maxMagnitude) * 100);
    }


    let row = document.createElement('div');
    let colNeg = document.createElement('div');
    let colPos = document.createElement('div');
    let progressNeg = document.createElement('div');
    let progressPos = document.createElement('div');
    let progressBarNeg = document.createElement('div');
    let progressBarPos = document.createElement('div');
    let progressBarNegMessage = document.createTextNode(axisName);
    let progressBarPosMessage = document.createTextNode(axisName);

    row.setAttribute('class', 'row');
    colNeg.setAttribute('class', 'col-6');
    colPos.setAttribute('class', 'col-6');
    progressNeg.setAttribute('class', 'progress flex-row-reverse my-1');
    progressPos.setAttribute('class', 'progress my-1');
    progressBarNeg.setAttribute('class', 'progress-bar');
    progressBarNeg.setAttribute('style', 'width:' + negWidth + '%');
    progressBarPos.setAttribute('class', 'progress-bar');
    progressBarPos.setAttribute('style', 'width:' + posWidth + '%');

    progressBarNeg.appendChild(progressBarNegMessage);
    progressBarPos.appendChild(progressBarPosMessage);
    progressNeg.appendChild(progressBarNeg);
    progressPos.appendChild(progressBarPos);
    colNeg.appendChild(progressNeg);
    colPos.appendChild(progressPos);
    row.appendChild(colNeg);
    row.appendChild(colPos);
    element.appendChild(row);
  });

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
