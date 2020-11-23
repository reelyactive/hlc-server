/**
 * Copyright reelyActive 2020
 * We believe in an open Internet of Things
 */


// Note the playing a video without user interaction likely requires the video
// to be muted (muted="muted"), unless, in Chrome, the user has set
// chrome://settings/content/sound to "No user gesture is required" or Chrome
// has been launched with --autoplay-policy=no-user-gesture-required


// Constant definitions
const INACTIVITY_TIMEOUT_MILLISECONDS = 12000;
const SIGNATURE_SEPARATOR = '/';


// DOM elements
let video = document.getElementById('video');


// Other variables
let selectedIdSignature;
let videoResetTimeout;


// Handle optional search parameters
let params = new URLSearchParams(document.location.search.substring(1));
let searchTransmitterIdSignature = params.get('transmitterIdSignature');
let searchVideoUrl = params.get('videoUrl');
if(searchTransmitterIdSignature) {
  selectedIdSignature = searchTransmitterIdSignature;
  console.log('Filter for transmitterIdSignature', selectedIdSignature);
}
if(searchVideoUrl) {
  video.src = searchVideoUrl;
  video.type = 'video/' +
               searchVideoUrl.substring(searchVideoUrl.lastIndexOf('.') + 1);
  console.log('Load video from', video.src, 'of type', video.type);
}


// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Handle raddec events
beaver.on([ 2 ], handleRaddecPackets); // Packets


// Handle a raddec event with Packets
function handleRaddecPackets(raddec) {
  let transmitterSignature = determineTransmitterSignature(raddec);
  let isTargetTransmitter = (transmitterSignature === selectedIdSignature) ||
                            !selectedIdSignature;

  if((isTargetTransmitter) && (isSensorEvent(raddec))) {
    clearTimeout(videoResetTimeout);
    video.play();
    videoResetTimeout = setTimeout(resetVideo,
                                   INACTIVITY_TIMEOUT_MILLISECONDS);
  }
}


// Reset the video
function resetVideo() {
  video.pause();
  video.currentTime = 0;
}


// Determine if the given raddec includes a triggering sensor event
function isSensorEvent(raddec) {
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


// Determine if the given packet is from a triggering sensor device
function isSensorPacket(packet) {
  let isMinew = (packet.substr(26,4) === 'e1ff');

  // TODO: in future support additional user-selectable triggers
  if(isMinew) {
    let isAcceleration = (packet.substr(38,4) === 'a103');

    return isAcceleration;
  }

  return false;
}


// Determine the transmitter signature for the given raddec
function determineTransmitterSignature(raddec) {
  return raddec.transmitterId + SIGNATURE_SEPARATOR + raddec.transmitterIdType;
}


