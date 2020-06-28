/**
 * Copyright reelyActive 2019-2020
 * We believe in an open Internet of Things
 */


// Constants
const PLAY_UPDATE_MILLISECONDS = 1800;
const SIGNATURE_SEPARATOR = '/';
const DIRACT_PACKET_SIGNATURE = 'ff830501';
const DIRACT_PACKET_SIGNATURE_OFFSET = 24;
const EDDYSTONE_UID_PACKET_SIGNATURE = 'aafe00';
const EDDYSTONE_UID_PACKET_SIGNATURE_OFFSET = 34;
const EDDYSTONE_UID_INSTANCE_ID_OFFSET = 66;
const DIRACT_INSTANCE_ID_LENGTH = 8;
const AXIS_NAMES = [ 'x', 'y', 'z' ];
const IMAGE_INTRO_BEAVER = 'images/intro-beaver.png';
const IMAGE_INTRO_PADDLE = 'images/intro-paddle.png';
const IMAGE_START = 'images/poke-nostrike.png';
const IMAGE_BEAVER_STRIKE = 'images/up-strike.png';
const IMAGE_POND_STRIKE = 'images/down-strike.png';
const IMAGES_NOSTRIKE = [
  'images/down-nostrike.png',
  'images/poke-nostrike.png',
  'images/up-nostrike.png'
];

// DOM elements
let beaverImage = document.querySelector('#beaverImage');
let beaverTransmitterId = document.querySelector('#beaverTransmitterId');
let beaverReceiverId = document.querySelector('#beaverReceiverId');
let beaverRssi = document.querySelector('#beaverRssi');
let nearestInstanceId = document.querySelector('#nearestInstanceId');
let nearestRssi = document.querySelector('#nearestRssi');
let paddleTransmitterId = document.querySelector('#paddleTransmitterId');
let paddleReceiverId = document.querySelector('#paddleReceiverId');
let paddleRssi = document.querySelector('#paddleRssi');
let paddleAccelerationCard = document.querySelector('#paddleAccelerationCard');

// Other variables
let beaverId;
let paddleId;
let beaverDirAct;
let paddleCandidateInstanceIds = [];
let paddleAcceleration = [ null, null, null ];
let currentBeaverPosition = 2;

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  if(isDirAct(raddec)) {
    updateBeaver(raddec);
  }
  else if(isAcceleration(raddec)) {
    updatePaddle(raddec);
  }
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  if(raddec.transmitterId === beaverId) {
    beaverId = null;
    paddleId = null;
  }
  else if(raddec.transmitterId === paddleId) {
    paddleId = null;
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

// Determine if the given raddec contains accelerometer data
function isAcceleration(raddec) {
  let foundAccelerationPacket = false;
  let hasPackets = (raddec.hasOwnProperty('packets') &&
                    (raddec.packets.length > 0));

  if(hasPackets) {
    raddec.packets.forEach(function(packet) {
      let isMinew = (packet.substr(26,4) === 'e1ff');
      let isAcceleration = (packet.substr(38,4) === 'a103');

      if(isMinew && isAcceleration) {
        foundAccelerationPacket = true;
      }
    });
  }

  return foundAccelerationPacket;
}

// Update the beaver data
function updateBeaver(raddec) {
  let isNewBeaver = (beaverId === undefined) || (beaverId === null);
  if(isNewBeaver) {
    beaverId = raddec.transmitterId;
    beaverTransmitterId.textContent = beaverId;
    beaverImage.src = IMAGE_INTRO_PADDLE;
  }

  let isCurrentBeaver = (raddec.transmitterId === beaverId);
  if(isCurrentBeaver) {
    beaverReceiverId.textContent = raddec.rssiSignature[0].receiverId;
    beaverRssi.textContent = raddec.rssiSignature[0].rssi + ' dBm';

    raddec.packets.forEach(function(packet) {
      let signature = packet.substr(DIRACT_PACKET_SIGNATURE_OFFSET,
                                    DIRACT_PACKET_SIGNATURE.length);
      if(signature === DIRACT_PACKET_SIGNATURE) {
        beaverDirAct = parseDirActPacket(packet);

        let isNearest = (beaverDirAct.nearest.length > 0);
        if(isNearest) {
          nearestInstanceId.textContent = beaverDirAct.nearest[0].instanceId;
          nearestRssi.textContent = beaverDirAct.nearest[0].rssi + ' dBm';
        }
        else {
          nearestInstanceId.textContent = '\u2026';
          nearestRssi.textContent = '\u2014 dBm';
        }

        beaverDirAct.nearest.forEach(function(device) {
          let isNewCandidatePaddle = !paddleCandidateInstanceIds.includes(
                                                             device.instanceId);
          if(isNewCandidatePaddle) {
            paddleCandidateInstanceIds.push(device.instanceId);
          }
        });
      }
    });
  }
}

// Update the paddle data
function updatePaddle(raddec) {
  let isNoPaddle = (paddleId === undefined) || (paddleId === null);
  if(isNoPaddle) {
    let instanceId = determineDirActInstanceId(raddec);
    let isCandidatePaddle = paddleCandidateInstanceIds.includes(instanceId);

    if(isCandidatePaddle) {
      paddleId = raddec.transmitterId;
      paddleTransmitterId.textContent = paddleId;
      beaverImage.src = IMAGE_START;
      play();
    }
  }

  let isCurrentPaddle = (raddec.transmitterId === paddleId);
  if(isCurrentPaddle) {
    paddleReceiverId.textContent = raddec.rssiSignature[0].receiverId;
    paddleRssi.textContent = raddec.rssiSignature[0].rssi + ' dBm';

    paddleAcceleration = determineAcceleration(raddec);
    let element = createMagnitudeDisplay(paddleAcceleration, 2);
    paddleAccelerationCard.innerHTML = '';
    paddleAccelerationCard.appendChild(element);
  }
}

// Iteratively play the game
function play() {
  let isBeaverDisappeared = !beaverId;
  let isPaddleDisappeared = !paddleId;
  let isBeaverUp = (currentBeaverPosition === 2);
  let isStrike = (Math.abs(paddleAcceleration[0]) >
                  Math.abs(paddleAcceleration[1])) ||
                 (Math.abs(paddleAcceleration[2]) >
                  Math.abs(paddleAcceleration[1]));

  if(isPaddleDisappeared) {
    paddleTransmitterId.textContent = '\u2026';
    paddleReceiverId.textContent = '\u2026';
    paddleRssi.textContent = '\u2014 dBm';
    paddleAccelerationCard.innerHTML = '';
  }

  if(isBeaverDisappeared) {
    beaverImage.src = IMAGE_INTRO_BEAVER;
    beaverTransmitterId.textContent = '\u2026';
    beaverReceiverId.textContent = '\u2026';
    beaverRssi.textContent = '\u2014 dBm';
    nearestInstanceId.textContent = '\u2026';
    nearestRssi.textContent = '\u2014 dBm';
    return;
  }

  if(isStrike) {
    if(isBeaverUp) {
      beaverImage.src = IMAGE_BEAVER_STRIKE;
    }
    else {
      beaverImage.src = IMAGE_POND_STRIKE;
      currentBeaverPosition = 0;
    }
  }
  else {
    if(isBeaverUp) {
      currentBeaverPosition = 1;
    }
    else {
      currentBeaverPosition = Math.floor(Math.random() * 3);
    }
    beaverImage.src = IMAGES_NOSTRIKE[currentBeaverPosition];
  }

  setTimeout(play, PLAY_UPDATE_MILLISECONDS);
}

// Determine the DirAct instance ID, if in the packets of the given raddec
function determineDirActInstanceId(raddec) {
  let instanceId = null;

  raddec.packets.forEach(function(packet) {
    let signature = packet.substr(EDDYSTONE_UID_PACKET_SIGNATURE_OFFSET,
                                  EDDYSTONE_UID_PACKET_SIGNATURE.length);
    if(signature === EDDYSTONE_UID_PACKET_SIGNATURE) {
      instanceId = packet.substr(EDDYSTONE_UID_INSTANCE_ID_OFFSET,
                                 DIRACT_INSTANCE_ID_LENGTH);
    }
  });

  return instanceId;
}

// Determine the acceleration from the packets of the given raddec
function determineAcceleration(raddec) {
  let acceleration = [ null, null, null ];

  raddec.packets.forEach(function(packet) {
    let isMinew = (packet.substr(26,4) === 'e1ff');
    let isAcceleration = (packet.substr(38,4) === 'a103');

    if(isMinew && isAcceleration) {
      acceleration[0] = (fixedPointToDecimal(packet.substr(44, 4))).toFixed(2);
      acceleration[1] = (fixedPointToDecimal(packet.substr(48, 4))).toFixed(2);
      acceleration[2] = (fixedPointToDecimal(packet.substr(52, 4))).toFixed(2);
    }
  });

  return acceleration;
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

// Convert the given signed 8.8 fixed-point hexadecimal string to decimal
function fixedPointToDecimal(word) {
  let integer = parseInt(word.substr(0,2),16);
  let decimal = parseInt(word.substr(2,2),16) / 256;

  if(integer > 127) {
    return ((integer - 256) + decimal);
  }
  return (integer + decimal);
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
