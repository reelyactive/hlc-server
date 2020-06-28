/**
 * Copyright reelyActive 2020
 * We believe in an open Internet of Things
 */


// Constants
const DASHBOARD_UPDATE_MILLISECONDS = 2000;
const STATISTICS_INTERVAL_MILLISECONDS = 1000;
const DEFAULT_ID_FILTER_VALUE = 'ac233';
const SNIFFYPEDIA_BASE_URL = 'https://sniffypedia.org/';
const DEFAULT_ASSOCIATIONS_SERVER_URL = '../../..';
const MINEW_UUID16 = 'ffe1';
const AXIS_NAMES = [ 'x', 'y', 'z' ];
const SIGNATURE_SEPARATOR = '/';
const SORT_BY_OPTIONS = [
    '\u21e1 transmitterId',
    '\u21e3 transmitterId',
    '\u21e1 receiverId',
    '\u21e3 receiverId',
    '\u21e1 rssi',
    '\u21e3 rssi'
];
const EVENT_ICONS = [
    'fas fa-sign-in-alt',
    'fas fa-route',
    'fas fa-info',
    'fas fa-heartbeat',
    'fas fa-sign-out-alt'
];


// DOM elements
let raddecRate = document.querySelector('#raddecRate');
let numTransmitters = document.querySelector('#numTransmitters');
let sniffypediaCard = document.querySelector('#sniffypediaCard');
let digitalTwinsRatio = document.querySelector('#digitalTwinsRatio');
let numStories = document.querySelector('#numStories');
let sensorCards = document.querySelector('#sensorCards');
let idFilter = document.querySelector('#idFilter');
let sortBy = document.querySelector('#sortBy');
let displayCount = document.querySelector('#displayCount');
let raddecTableBody = document.querySelector('#raddecTableBody');


// Other variables
let transmitters = new Map();
let receivers = new Map();
let urls = {};
let raddecCount = 0;
let raddecsPerSecond = 0;
let twinPercentage = 0;
let topUrl;
let sortFunction;
let associationsServerUrl = DEFAULT_ASSOCIATIONS_SERVER_URL;


// Initialise raddec table filter values
idFilter.value = DEFAULT_ID_FILTER_VALUE;
SORT_BY_OPTIONS.forEach(function(element, index) {
  let option = document.createElement('option');
  option.value = index;
  option.text = element;
  sortBy.add(option, null);
});
sortBy.value = 5;
updateSortFunction();

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  let transmitterSignature = determineTransmitterSignature(raddec);
  handleRaddec(transmitterSignature, raddec);
  raddecCount++;
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  let transmitterSignature = determineTransmitterSignature(raddec);
  handleDisappearance(transmitterSignature, raddec);
});

// Handle a (non-disappearance) raddec
function handleRaddec(transmitterSignature, raddec) {
  let transmitter;
  let receiverSignature = determineStrongestReceiverSignature(raddec);
  let isNewTransmitter = !transmitters.has(transmitterSignature);
  let isNewReceiver = !receivers.has(receiverSignature);

  if(isNewTransmitter) {
    transmitter = {
        url: null,
        identifiers: { uuid16: [], uuid128: [], companyIdentifiers: [] },
        sensors: {}
    }
    insertRaddec(transmitterSignature, raddec);
  }
  else {
    transmitter = transmitters.get(transmitterSignature);
    updateRaddec(transmitterSignature, raddec);
  }
  transmitter.receiverSignature = receiverSignature;

  if(isNewReceiver) {
    cormorant.retrieveAssociations(associationsServerUrl, receiverSignature,
                                   true, function(associations) {
      receivers.set(receiverSignature, { url: associations.url || null });
    });
  }

  raddec.packets.forEach(function(packet) {
    parsePacket(packet, transmitter);
  });

  handleUrl(transmitter);
  handleSensors(transmitterSignature, transmitter);
  sortRaddecsAndHighlight(transmitterSignature);
  updateDisplayCount();

  transmitters.set(transmitterSignature, transmitter);
}

// Handle a disappearance
function handleDisappearance(transmitterSignature) {
  let isExistingTransmitter = transmitters.has(transmitterSignature);

  if(isExistingTransmitter) {
    let transmitter = transmitters.get(transmitterSignature);
    let hasUrl = (transmitter.url !== null);
    let tr = document.getElementById(transmitterSignature);
    let accelerationCard = document.getElementById(transmitterSignature +
                                                   '-acceleration');

    if(hasUrl) {
      urls[transmitter.url].count--;
    }
    if(tr) {
      tr.remove();
      updateDisplayCount();
    }
    if(accelerationCard) {
      accelerationCard.remove();
    }

    transmitters.delete(transmitterSignature);
  }
}

// Handle the given transmitter's URL
function handleUrl(transmitter) {
  let hasUrl = (transmitter.url !== null);

  if(!hasUrl) {
    let url = determineUrlFromIdentifiers(transmitter.identifiers);

    if(url) {
      let isNewUrl = !urls.hasOwnProperty(url);

      if(isNewUrl) {
        urls[url] = { count: 0 };
        cormorant.retrieveStory(url, function(story) {});
      }

      urls[url].count++;
      transmitter.url = url;
    }
  }
}

// Handle the given transmitter's sensors, if any
function handleSensors(transmitterSignature, transmitter) {
  let isAcceleration = transmitter.sensors.hasOwnProperty('acceleration');

  if(isAcceleration) {
    let id = transmitterSignature + '-acceleration';
    let card = document.getElementById(id);
    let display = createMagnitudeDisplay(transmitter.sensors.acceleration, 2);
    let displayArea;

    if(!card) {
      let header = document.createElement('div');
      let headerIcon = document.createElement('i');
      let headerText = document.createTextNode('\u00a0 Acceleration \u00a0');
      let headerId = document.createElement('span');
      let body = document.createElement('div');
      card = document.createElement('div');
      card.setAttribute('id', id);
      card.setAttribute('class', 'card mb-4');
      header.setAttribute('class',
                          'card-header text-truncate text-white bg-dark');
      headerIcon.setAttribute('class', 'fas fa-rocket');
      headerId.setAttribute('class', 'monospace');
      headerId.textContent = transmitterSignature;
      body.setAttribute('class',
                        'card-body text-center text-truncate display-4');
      displayArea = document.createElement('div');
      displayArea.setAttribute('class', 'displayArea');

      header.appendChild(headerIcon);
      header.appendChild(headerText);
      header.appendChild(headerId);
      body.appendChild(displayArea);
      card.appendChild(header);
      card.appendChild(body);
      sensorCards.append(card);
    }
    else {
      displayArea = Array.from(card.getElementsByClassName('displayArea'))[0];
    }

    displayArea.innerHTML = '';
    displayArea.appendChild(display);
  }
}

// Parse the given packet, appending data to the given transmitter
function parsePacket(packet, transmitter) {
  let isTooShort = (packet.length <= 16);
  if(isTooShort) return;

  let length = parseInt(packet.substr(2,2),16) % 64;
  let isInvalidLength = (packet.length !== ((length + 2) * 2));
  if(isInvalidLength) return;

  let data = packet.substr(16);
  let dataLength = data.length;
  let index = 0;

  while(index < dataLength) {
    let length = parseInt(data.substr(index,2), 16) + 1;
    let dataType = data.substr(index + 2, (length + 1) * 2);
    parseDataType(dataType, transmitter);
    index += (length * 2);
  }

  let isMinew = (packet.substr(26,4) === 'e1ff');
  if(isMinew) {
    parseMinew(packet, transmitter);
  }
}

// Parse the data type at the given index, extracting any data
function parseDataType(dataType, transmitter) {
  let gapType = parseInt(dataType.substr(0,2), 16);
  let identifier = '';

  switch(gapType) {
    case 0x02: // Incomplete list of 16-bit UUIDs
    case 0x03: // Complete list of 16-bit UUIDs
      for(let cByte = 2; cByte > 0; cByte--) {
        identifier += dataType.substr(cByte * 2, 2);
      }
      if(!transmitter.identifiers.uuid16.includes(identifier)) {
        transmitter.identifiers.uuid16.push(identifier);
      }
      break;
    case 0x06: // Incomplete list of 128-bit UUIDs
    case 0x07: // Complete list of 128-bit UUIDs
      for(let cByte = 16; cByte > 0; cByte--) {
        identifier += dataType.substr(cByte * 2, 2);
      }
      if(!transmitter.identifiers.uuid128.includes(identifier)) {
        transmitter.identifiers.uuid128.push(identifier);
      }
      break;
    case 0xff: // Manufacturer specific data
      identifier = dataType.substr(4,2) + dataType.substr(2,2);
      if(!transmitter.identifiers.companyIdentifiers.includes(identifier)) {
        transmitter.identifiers.companyIdentifiers.push(identifier);
      }
      break;
  }
}

// Parse Minew data
function parseMinew(packet, transmitter) {
  switch(packet.substr(38,4)) {
    case 'a101': // Temperature & Humidity
      transmitter.sensors.temperature = (parseInt(packet.substr(44, 2), 16) +
                                         parseInt(packet.substr(46, 2), 16) /
                                         256).toFixed(1);
      transmitter.sensors.humidity = (parseInt(packet.substr(48, 2), 16) +
                                      parseInt(packet.substr(50, 2), 16) /
                                      256).toFixed(1);
      temperature.textContent = transmitter.sensors.temperature + '\u2103';
      humidity.textContent =  transmitter.sensors.humidity + '%';
      break;
    case 'a103': // Accleration
      let acceleration = [];
      acceleration.push(fixedPointToDecimal(packet.substr(44, 4)).toFixed(2));
      acceleration.push(fixedPointToDecimal(packet.substr(48, 4)).toFixed(2));
      acceleration.push(fixedPointToDecimal(packet.substr(52, 4)).toFixed(2));
      transmitter.sensors.acceleration = acceleration;
      break;
  }
}

// Lookup in the Sniffypedia index the given identifiers, return URL
function determineUrlFromIdentifiers(identifiers) {
  let route;

  // Company identifiers have lowest precedence
  identifiers.companyIdentifiers.forEach(function(companyIdentifier) {
    if(ble.companyIdentifiers.hasOwnProperty(companyIdentifier)) {
      route = ble.companyIdentifiers[companyIdentifier];
    }
  });

  identifiers.uuid128.forEach(function(uuid128) {
    if(ble.uuid128.hasOwnProperty(uuid128)) {
      route = ble.uuid128[uuid128];
    }
  });

  // 16-bit UUIDs have highest precedence
  identifiers.uuid16.forEach(function(uuid16) {
    if(ble.uuid16.hasOwnProperty(uuid16)) {
      route = ble.uuid16[uuid16];
    }
  });

  if(route) {
    return SNIFFYPEDIA_BASE_URL + route;
  }

  return null;
}

// Determine the transmitter signature for the given raddec
function determineTransmitterSignature(raddec) {
  return raddec.transmitterId + SIGNATURE_SEPARATOR +
         raddec.transmitterIdType;
}

// Determine the strongest receiver signature for the given raddec
function determineStrongestReceiverSignature(raddec) {
  return raddec.rssiSignature[0].receiverId + SIGNATURE_SEPARATOR +
         raddec.rssiSignature[0].receiverIdType;
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

// Update the Sniffypedia card
function updateSniffypediaCard() {
  let transmitterCount = urls[topUrl].count;
  let card = document.createElement('div');
  let listGroupItems = [ {
      text: transmitterCount,
      itemClass: "text-white bg-dark display-4 text-right"
  } ];
  card.setAttribute('class', 'card');

  cuttlefish.render(cormorant.stories[topUrl], sniffypediaCard,
                    { listGroupItems: listGroupItems});
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

// Insert a raddec into the table
function insertRaddec(transmitterSignature, raddec) {
  let receiverId = raddec.rssiSignature[0].receiverId;
  let helloTransmitterLink = '../hello-transmitter/?transmitterIdSignature=' +
                             transmitterSignature;
  let tr = document.createElement('tr');
  let a = document.createElement('a');

  tr.setAttribute('id', transmitterSignature);
  tr.setAttribute('class', 'monospace');

  a.setAttribute('href', helloTransmitterLink);
  a.textContent = raddec.transmitterId;

  appendTd(tr, a, 'text-right');
  appendTd(tr, prepareEvents(raddec), 'text-center');
  appendTd(tr, receiverId, 'text-right');
  appendTd(tr, raddec.rssiSignature[0].rssi, 'text-right');
  appendTd(tr, 'n/a', 'text-center');

  updateVisibility(tr, [ raddec.transmitterId, receiverId ]);
  raddecTableBody.prepend(tr);
}

// Insert a raddec into the table
function updateRaddec(transmitterSignature, raddec) {
  let tr = document.getElementById(transmitterSignature);
  let tds = tr.getElementsByTagName('td');
  updateNode(tds[1], prepareEvents(raddec));
  updateNode(tds[2], raddec.rssiSignature[0].receiverId);
  updateNode(tds[3], raddec.rssiSignature[0].rssi);
  updateVisibility(tr, [ tds[0].textContent, tds[2].textContent ]);
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
  let trs = Array.from(raddecTableBody.getElementsByTagName('tr'));

  trs.forEach(function(tr) {
    if(tr.style.display === '') {
      visibleCount++;
    }
  });
  displayCount.value = visibleCount + ' of ' + transmitters.size;
}

// Sort the raddecs in the table, highlighting the given transmitter
function sortRaddecsAndHighlight(transmitterSignature) {
  let trs = Array.from(raddecTableBody.getElementsByTagName('tr'));
  let sortedFragment = document.createDocumentFragment();

  trs.sort(sortFunction);

  trs.forEach(function(tr) {
    if(tr.id === transmitterSignature) {
      tr.setAttribute('class', 'monospace animated-highlight-reelyactive');
    }
    else {
      tr.setAttribute('class', 'monospace');
    }
    sortedFragment.appendChild(tr);
  });

  raddecTableBody.appendChild(sortedFragment);
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
  }
  sortRaddecsAndHighlight();
}

// Update the infrastructure cards
function updateInfrastructure() {
  let receiverCounts = {};

  transmitters.forEach(function(transmitter) {
    let isNewReceiver = !receiverCounts.hasOwnProperty(
                                        transmitter.receiverSignature);
    if(isNewReceiver) {
      receiverCounts[transmitter.receiverSignature] = 1;
    }
    else {
      receiverCounts[transmitter.receiverSignature]++;
    }
  });

  for(receiverSignature in receiverCounts) {
    let card = document.getElementById(receiverSignature);

    if(!card) {
      let row = document.createElement('div');
      let imgCol = document.createElement('div');
      let img = document.createElement('img');
      let infoCol = document.createElement('div');
      let infoBody = document.createElement('div');
      let infoBodyTitle = document.createElement('h5');
      let infoBodyText = document.createElement('p');
      let statusCol = document.createElement('div');
      let statusBody = document.createElement('div');
      let statusText = document.createElement('p');
      let statusTextCount = document.createElement('span');
      let statusTextIcon = document.createElement('i');
      card = document.createElement('div');
      card.setAttribute('id', receiverSignature);
      card.setAttribute('class', 'card mb-4');
      row.setAttribute('class', 'row no-gutters');
      imgCol.setAttribute('class', 'col-md-1');
      img.src = 'images/owl-in-one.jpg';
      img.setAttribute('class', 'card-img');
      infoCol.setAttribute('class', 'col-md-8');
      infoBody.setAttribute('class', 'card-body');
      infoBodyTitle.setAttribute('class', 'card-title monospace');
      infoBodyTitle.textContent = receiverSignature;
      infoBodyText.setAttribute('class', 'card-title lead receiverMetadata');
      statusCol.setAttribute('class', 'col-md-3');
      statusBody.setAttribute('class', 'card-body');
      statusText.setAttribute('class', 'card-text text-right');
      statusTextCount.setAttribute('class', 'display-4 transmitterCount');
      statusTextCount.textContent = receiverCounts[receiverSignature] +
                                    '\u00a0';
      statusTextIcon.setAttribute('class', 'lead fas fa-wifi');

      card.appendChild(row);
      row.appendChild(imgCol);
      row.appendChild(infoCol);
      row.appendChild(statusCol);
      imgCol.appendChild(img);
      infoCol.appendChild(infoBody);
      statusCol.appendChild(statusBody);
      statusBody.appendChild(statusText);
      statusText.appendChild(statusTextCount);
      statusText.appendChild(statusTextIcon);
      infoBody.appendChild(infoBodyTitle);
      infoBody.appendChild(infoBodyText);
      infrastructureCards.appendChild(card);
    }
    else {
      let receiver = receivers.get(receiverSignature);
      let hasStory = (receiver.url && cormorant.stories[receiver.url]);
      let statusTextCount = card.getElementsByClassName('transmitterCount')[0];
      statusTextCount.textContent = receiverCounts[receiverSignature] +
                                    '\u00a0';

      if(hasStory) {
        let story = cormorant.stories[receiver.url];
        let imgSrc = cuttlefish.determineImageUrl(story);
        let title = cuttlefish.determineTitle(story);
        let img = card.getElementsByTagName('img')[0];
        let metadata = card.getElementsByClassName('receiverMetadata')[0];
        img.src = imgSrc;
        metadata.textContent = title;
      }
    }
  }
}

// Update the showcase dashboard
function updateDashboard() {
  raddecRate.textContent = raddecsPerSecond;
  numTransmitters.textContent = transmitters.size;
  numStories.textContent = Object.keys(cormorant.stories).length;
  digitalTwinsRatio.textContent = twinPercentage + '%';
  updateSniffypediaCard();
  updateInfrastructure();
}

// Update statistics
function updateStatistics() {
  let twinnedCount = 0;
  let topUrlCount = 0;

  for(let url in urls) {
    let count = urls[url].count;
    twinnedCount += count;
    if(count > topUrlCount) {
      topUrl = url;
      topUrlCount = count;
    }
  }
  twinPercentage = (100 * (twinnedCount / transmitters.size)).toFixed(0);

  raddecsPerSecond = Math.round(1000 * raddecCount /
                                STATISTICS_INTERVAL_MILLISECONDS);
  raddecCount = 0;
}

// Handle ID filter changes
idFilter.addEventListener('keyup', function() {
  let trs = raddecTableBody.getElementsByTagName('tr');
  for(let tr of trs) {
    let tds = tr.getElementsByTagName('td');
    updateVisibility(tr, [ tds[0].textContent, tds[2].textContent ]);
  }
  updateDisplayCount();
});

// Handle sortBy changes
sortBy.addEventListener('change', updateSortFunction);

setInterval(updateDashboard, DASHBOARD_UPDATE_MILLISECONDS);
setInterval(updateStatistics, STATISTICS_INTERVAL_MILLISECONDS);