/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */

//Constants
const RSSI_THRESHOLD = -47;
const IMAGE_CHANGE_INTERVAL = 3500;

// DOM elements
let holes = [
  document.getElementById("image1"),
  document.getElementById("image2"),
  document.getElementById("image3")
];
let images = ['images/hole1.png', 'images/hole2.png','images/hole3.png','images/hole3.png','images/hole3.png'];

let detectionList = [false, false, false];
let beaverAppearance = [false, false, false];
let receiverIds = [];

// Connect to the socket.io stream and feed to beaver
let baseUrl = 
  window.location.protocol + 
  '//' + 
  window.location.hostname +
  ':' + 
  window.location.port;

let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  updateReceiverIds(raddec);
  detectaWhac(raddec);
  whacABeaver();
});

function updateReceiverIds(raddec) {
  raddec.rssiSignature.forEach(function(receiver) {
    let receiverId = receiver.receiverId;
    if (!receiverIds.includes(receiverId)) {
      receiverIds.push(receiverId);
    }
  }) 
}

function detectaWhac(raddec) {
  let receiverId = raddec.rssiSignature[0].receiverId;
  let transmitterId = raddec.transmitterId;
  let rssi = raddec.rssiSignature[0].rssi;
  if (rssi > RSSI_THRESHOLD) {
    let receiverIndex = receiverIds.indexOf(receiverId);
    detectionList[receiverIndex] = true;
  }
}

//Change images randomly
function changeRandomlyImage() {
  beaverAppearance.forEach(function(isWhacable, index) {
    if (!detectionList[index]) {
      let randomIndex = Math.floor(Math.random()*images.length);
      let imageSource = images[randomIndex];
      holes[index].src = imageSource;
      if (randomIndex === 0) {
        beaverAppearance[index] = true;
      }
      else {
        beaverAppearance[index] = false;
      }
    }
  }) 
} 
  
function whacABeaver() {
  detectionList.forEach(function(isWhac, index) {
    if (isWhac) {
      detectionList[index] = false;
      if (beaverAppearance[index]) {
        holes[index].src = 'images/hole5.png';
      }
      else {
        holes[index].src = 'images/hole4.png';
      }
    }
  })   
}

setInterval(changeRandomlyImage, IMAGE_CHANGE_INTERVAL);	
