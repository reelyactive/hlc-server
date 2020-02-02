/**
 * Copyright reelyActive 2019-2020
 * We believe in an open Internet of Things
 */


// Constants
const UPDATE_INTERVAL_MILLISECONDS = 2000;
const SNIFFYPEDIA_BASE_URL = 'https://sniffypedia.org/';


// DOM elements
let numTransmitters = document.querySelector('#numTransmitters');
let digitalTwinsRatio = document.querySelector('#digitalTwinsRatio');
let cards = document.querySelector('#cards');


// Other variables
let devices = {};
let urls = {};
let isUpdateRequired = false;


// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  let isNewDevice = !devices.hasOwnProperty(raddec.transmitterId);
  let isValidUrl = !isNewDevice &&
                   (devices[raddec.transmitterId].url !== null);

  if(isNewDevice) {
    devices[raddec.transmitterId] = { url: null };
  }

  if(!isValidUrl) {
    let url = determineUrl(raddec.packets);

    if(url) {
      let isNewUrl = !urls.hasOwnProperty(url);

      if(isNewUrl) {
        urls[url] = { count: 0 };
        cormorant.retrieveStory(url, function(story) {
          let card = createCard(story, '1 device');
          cards.appendChild(card);
        });
      }
      else {
        isUpdateRequired = true;
      }

      urls[url].count++;
      devices[raddec.transmitterId].url = url;
    }
  }
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  let isExistingDevice = devices.hasOwnProperty(raddec.transmitterId);

  if(isExistingDevice) {
    let url = devices[raddec.transmitterId].url;
    let isValidUrl = url && urls.hasOwnProperty(url);

    if(isValidUrl) {
      urls[url].count--;
      isUpdateRequired = true;
    }

    delete devices[raddec.transmitterId];
  }
});


// Determine the URL associated with the given device
function determineUrl(packets) {
  let identifiers = {
      uuid16: [],
      uuid128: [],
      companyIdentifiers: []
  };

  packets.forEach(function(packet) {
    parsePacketIdentifiers(packet, identifiers);
  });

  return lookupIdentifiers(identifiers);
}

// Parse the given packets, extracting all identifiers
// TODO: in future this will be handled server-side, just a stopgap for now
function parsePacketIdentifiers(packet, identifiers) {
  let isTooShort = (packet.length <= 16);

  if(isTooShort) {
    return identifiers;
  }

  let length = parseInt(packet.substr(2,2),16) % 64;
  let isInvalidLength = (packet.length !== ((length + 2) * 2));

  if(isInvalidLength) {
    return identifiers;
  }

  let data = packet.substr(16);
  let dataLength = data.length;
  let index = 0;

  while(index < dataLength) {
    let length = parseInt(data.substr(index,2), 16) + 1;
    let dataType = data.substr(index + 2, (length + 1) * 2);
    parseDataType(dataType, identifiers);
    index += (length * 2);
  }

  return identifiers;
}


// Parse the data type at the given index, extracting any identifier(s)
function parseDataType(dataType, identifiers) {
  let gapType = parseInt(dataType.substr(0,2), 16);
  let identifier = '';

  switch(gapType) {
    case 0x02: // Incomplete list of 16-bit UUIDs
    case 0x03: // Complete list of 16-bit UUIDs
      for(let cByte = 2; cByte > 0; cByte--) {
        identifier += dataType.substr(cByte * 2, 2);
      }
      identifiers.uuid16.push(identifier);
      break;
    case 0x06: // Incomplete list of 128-bit UUIDs
    case 0x07: // Complete list of 128-bit UUIDs
      for(let cByte = 16; cByte > 0; cByte--) {
        identifier += dataType.substr(cByte * 2, 2);
      }
      identifiers.uuid128.push(identifier);
      break;
    case 0xff: // Manufacturer specific data
      identifier = dataType.substr(4,2) + dataType.substr(2,2);
      identifiers.companyIdentifiers.push(identifier);
      break;
  }
}


// Lookup in the Sniffypedia index the given identifiers, return URL
function lookupIdentifiers(identifiers) {
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


// Create the card from the given story
function createCard(story, text) {
  let card = document.createElement('div');
  let listGroupItems = [ {
      text: text,
      itemClass: "text-white bg-dark",
      iconClass: "fas fa-info-circle"
  } ];
  card.setAttribute('class', 'card');
  cuttlefish.render(story, card, { listGroupItems: listGroupItems });
  
  return card;
}


// Update all the cards
function updateCards() {
  if(!isUpdateRequired) {
    return;
  }

  let updatedCards = document.createDocumentFragment();
  let orderedUrls = [];
  let orderedCounts = [];

  // Order the urls by device counts
  for(let url in urls) {
    let count = urls[url].count;

    if(orderedUrls.length === 0) {
      orderedUrls.push(url);
      orderedCounts.push(count);
    }
    else {
      for(let cUrl = 0; cUrl < orderedUrls.length; cUrl++) {
        if(count > orderedCounts[cUrl]) {
          orderedUrls.splice(cUrl, 0, url);
          orderedCounts.splice(cUrl, 0, count);
          cUrl = orderedUrls.length;
        }
        else if(cUrl === (orderedUrls.length - 1)) {
          orderedUrls.push(url);
          orderedCounts.push(count);
          cUrl = orderedUrls.length;
        }
      }
    }
  }

  // Create the updated cards in order of device counts
  for(let cUrl = 0; cUrl < orderedUrls.length; cUrl++) {
    let url = orderedUrls[cUrl];
    let count = orderedCounts[cUrl];

    if(count > 0) {
      let text = count;

      if(count === 1) {
        text += ' device';
      }
      else {
        text += ' devices';
      }

      let story = cormorant.stories[url];
      let card = createCard(story, text);
      updatedCards.appendChild(card);
    }
  }

  cards.innerHTML = '';
  cards.appendChild(updatedCards);

  isUpdateRequired = false;
}


// Update the stats
function updateStats() {
  let twinnedCount = 0;
  let deviceCount = Object.keys(devices).length;
  let twinPercentage = 0;

  for(let url in urls) {
    let count = urls[url].count;
    twinnedCount += count;
  }

  if(deviceCount > 0) {
    twinPercentage = (100 * (twinnedCount / deviceCount)).toFixed(0);
  }

  numTransmitters.textContent = deviceCount;
  digitalTwinsRatio.textContent = twinPercentage + '%';
}


setInterval(updateCards, UPDATE_INTERVAL_MILLISECONDS);
setInterval(updateStats, UPDATE_INTERVAL_MILLISECONDS);
