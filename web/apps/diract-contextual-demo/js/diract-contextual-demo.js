/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const SIGNATURE_SEPARATOR = '/';
const DIRACT_PACKET_SIGNATURE = 'ff830501';
const DIRACT_PACKET_SIGNATURE_OFFSET = 24;
const EDDYSTONE_UID_PACKET_SIGNATURE = 'c0deb10e1dd1e01bed0c';
const EDDYSTONE_UID_PACKET_SIGNATURE_OFFSET = 42;
const MIN_RSSI = -100;
const MAX_RSSI = -36;
const DEFAULT_STORY = {
  "@context": {
    "schema": "https://schema.org/"
  },
  "@graph": [
    {
      "@id": "diract",
      "@type": "schema:Product",
      "schema:name": "DirAct Device",
      "schema:image": "images/diract.png",
      "schema:manufacturer": {
        "@type": "schema:Organization",
        "schema:name": "reelyActive",
        "schema:url": "https://www.reelyactive.com"
      }
    }
  ]
};

// DOM elements
let diractCards = document.querySelector('#diractCards');

// Other variables
let devices = {};
let stories = {};
let sortFunction = function(card1, card2) {
  if(parseInt(card1.id, 16) < parseInt(card2.id, 16)) {
    return -1;
  };
  return 1;
}

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  if(isDirAct(raddec)) {
    updateDevice(raddec);
    lookupReceiver(raddec);
  }
  else if(isEddystoneUid(raddec)) {
    lookupEddystoneUid(raddec);
  }
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  if(isDirAct(raddec)) {
    let card = document.getElementById(raddec.transmitterId);
    diractCards.removeChild(card);
    delete devices[raddec.transmitterId];
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


// Determine if the given raddec is from a Eddystone-UID device
function isEddystoneUid(raddec) {
  let foundEddystoneUidPacket = false;
  let hasPackets = (raddec.hasOwnProperty('packets') &&
                    (raddec.packets.length > 0));

  if(hasPackets) {
    raddec.packets.forEach(function(packet) {
      let signature = packet.substr(EDDYSTONE_UID_PACKET_SIGNATURE_OFFSET,
                                    EDDYSTONE_UID_PACKET_SIGNATURE.length);
      if(signature === EDDYSTONE_UID_PACKET_SIGNATURE) {
        foundEddystoneUidPacket = true;
      }
    });
  }

  return foundEddystoneUidPacket;
}


// Look up any story related to the receiver
function lookupReceiver(raddec) {
  let strongestReceiver = raddec.rssiSignature[0];
  let receiverSignature = strongestReceiver.receiverId + SIGNATURE_SEPARATOR +
                          strongestReceiver.receiverIdType;

  cormorant.retrieveAssociations(baseUrl, receiverSignature, false,
                                 function(associations) {
    if(associations && associations.url) {
      cormorant.retrieveStory(associations.url, function(story) {
        stories[strongestReceiver.receiverId] = story;
      });
    }
  });
}


// Look up any story related to the Eddystone-UID beacon
function lookupEddystoneUid(raddec) {
  let deviceId = raddec.transmitterId;
  let transmitterSignature = raddec.transmitterId + SIGNATURE_SEPARATOR +
                             raddec.transmitterIdType;
  let instanceId;

  raddec.packets.forEach(function(packet) {
    let signature = packet.substr(EDDYSTONE_UID_PACKET_SIGNATURE_OFFSET,
                                  EDDYSTONE_UID_PACKET_SIGNATURE.length);
    if(signature === EDDYSTONE_UID_PACKET_SIGNATURE) {
      instanceId = packet.substr(66, 8);
    }
  });

  stories[deviceId] = Object.assign(DEFAULT_STORY);
  cormorant.retrieveAssociations(baseUrl, transmitterSignature, false,
                                 function(associations) {
    if(associations && associations.url) {
      cormorant.retrieveStory(associations.url, function(story) {
        stories[deviceId] = story;
        stories[instanceId] = story;
      });
    }
  });
}


// Update the DirAct device
function updateDevice(raddec) {
  let card;
  let deviceId = raddec.transmitterId;
  let closestInstanceId;
  let closestRssi;
  let receiverId = raddec.rssiSignature[0].receiverId;
  let isNewDirAct = !devices.hasOwnProperty(deviceId);

  if(isNewDirAct) {
    let transmitterSignature = raddec.transmitterId + SIGNATURE_SEPARATOR +
                               raddec.transmitterIdType;
    devices[deviceId] = {};
    card = document.createElement('div');
    card.setAttribute('id', deviceId);
    card.setAttribute('class', 'card border-light my-4');
    diractCards.append(card);
    sortCards();
    stories[deviceId] = Object.assign(DEFAULT_STORY);
    cormorant.retrieveAssociations(baseUrl, transmitterSignature, false,
                                   function(associations) {
      if(associations && associations.url) {
        cormorant.retrieveStory(associations.url, function(story) {
          stories[deviceId] = story;
        });
      }
    });
  }
  else {
    card = document.getElementById(deviceId);
  }

  raddec.packets.forEach(function(packet) {
    let signature = packet.substr(DIRACT_PACKET_SIGNATURE_OFFSET,
                                  DIRACT_PACKET_SIGNATURE.length);
    if(signature === DIRACT_PACKET_SIGNATURE) {
      devices[deviceId] = parseDirActPacket(packet);
      stories[devices[deviceId].instanceId] = stories[deviceId];
    }
  });

  if(devices[deviceId].nearest.length > 0) {
    closestInstanceId = devices[deviceId].nearest[0].instanceId;
    closestRssi = devices[deviceId].nearest[0].rssi;
  }
  updateCard(card, deviceId, closestInstanceId, closestRssi, receiverId);
}


// Updare the card contents in the DOM
function updateCard(card, deviceId, closestInstanceId, closestRssi,
                    receiverId) {
  let updatedContent = document.createDocumentFragment();
  let body = document.createElement('div');
  body.setAttribute('class', 'card-body');
  updatedContent.appendChild(body);

  let row = document.createElement('div');
  row.setAttribute('class', 'row');
  body.appendChild(row);

  let avatarCol = document.createElement('div');
  let avatarCard = document.createElement('div');
  avatarCol.setAttribute('class', 'col-md-3');
  avatarCard.setAttribute('class', 'card');
  cuttlefish.render(stories[deviceId], avatarCard);
  avatarCol.appendChild(avatarCard);
  row.appendChild(avatarCol);

  let heartCol = document.createElement('div');
  heartCol.setAttribute('class', 'col-md-3');
  if(closestRssi) {
    let heart = document.createElement('img');
    heart.setAttribute('src', 'images/heart.png');
    heart.setAttribute('width', calculateScalePercent(closestRssi));
    heart.setAttribute('height', 'auto');
    heart.setAttribute('class', 'mx-auto d-block');
    heartCol.appendChild(heart);
  }
  row.appendChild(heartCol);
  
  let nearestCol = document.createElement('div');
  nearestCol.setAttribute('class', 'col-md-3');
  if(closestInstanceId && stories.hasOwnProperty(closestInstanceId)) {
    let nearestCard = document.createElement('div');
    nearestCard.setAttribute('class', 'card');
    cuttlefish.render(stories[closestInstanceId], nearestCard);
    nearestCol.appendChild(nearestCard);
  }
  row.appendChild(nearestCol);

  let receiverCol = document.createElement('div');
  receiverCol.setAttribute('class', 'col-md-3');
  if(receiverId && stories.hasOwnProperty(receiverId)) {
    let receiverCard = document.createElement('div');
    receiverCard.setAttribute('class', 'card');
    cuttlefish.render(stories[receiverId], receiverCard);
    receiverCol.appendChild(receiverCard);
  }
  row.appendChild(receiverCol);

  card.innerHTML = '';
  card.appendChild(updatedContent);
}


// Calculate the scale percentage based on RSSI level
function calculateScalePercent(rssi) {
  let scalePercent = 100 * Math.min(1, Math.max(rssi - MIN_RSSI, 0)
                                       / (MAX_RSSI - MIN_RSSI));
  return scalePercent + '%';
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
