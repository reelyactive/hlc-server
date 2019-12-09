/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const SIGNATURE_SEPARATOR = '/';
const RADDEC_HISTORY_LENGTH = 5;
const RDPS = ' / ';
const EVENT_ICONS = [
    'fas fa-sign-in-alt',
    'fas fa-route',
    'fas fa-info',
    'fas fa-heartbeat',
    'fas fa-sign-out-alt'
];


// DOM elements
let idFilter = document.querySelector('#idFilter');
let idDropdown = document.querySelector('#idDropdown');
let resetButton = document.querySelector('#resetButton');
let selectButton = document.querySelector('#selectButton');
let raddecTableBody = document.querySelector('#raddecTableBody');
let rssiTableBody = document.querySelector('#rssiTableBody');
let txStoryVis = document.querySelector('#txStoryVis');
let txStoryJson = document.querySelector('#txStoryJson');
let rxStoryVis = document.querySelector('#rxStoryVis');
let rxStoryJson = document.querySelector('#rxStoryJson');


// Other variables
let idSignatures = [];
let selectedIdSignature;
let currentReceiverSignature;
let isSelected = false;
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let raddecs = [];


// Handle optional search parameters
let params = new URLSearchParams(document.location.search.substring(1));
let searchTransmitterIdSignature = params.get('transmitterIdSignature');
if(searchTransmitterIdSignature) {
  selectedIdSignature = searchTransmitterIdSignature;
  idFilter.value = searchTransmitterIdSignature;
  fetchAndUpdateStoryEntry();
}


// Connect to the socket.io stream and feed to beaver
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  let transmitterSignature = raddec.transmitterId +
                             SIGNATURE_SEPARATOR +
                             raddec.transmitterIdType;
  addIdentifierSignature(transmitterSignature);
  if(isSelected && (transmitterSignature === selectedIdSignature)) {
    updateTransmitter(raddec);
    updateReceiver(raddec);
  }
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  let transmitterSignature = raddec.transmitterId +
                             SIGNATURE_SEPARATOR +
                             raddec.transmitterIdType;
  removeIdentifierSignature(transmitterSignature);
  if(isSelected && (transmitterSignature === selectedIdSignature)) {
    updateTransmitter(raddec);
    rxStoryVis.innerHTML = '';
    rxStoryJson.innerHTML = '';
  }
});


// Add the given identifier signature to the list, if not already present
function addIdentifierSignature(idSignature) {
  if(!idSignatures.includes(idSignature)) {
    idSignatures.push(idSignature);
  }
}


// Remove the given identifier signature from the list, if present
function removeIdentifierSignature(idSignature) {
  if(idSignatures.includes(idSignature)) {
    let index = idSignatures.indexOf(idSignature);
    idSignatures.splice(index, 1);
  }
}


// Complete the input with the clicked identifier signature
function selectIdentifierSignature() {
  selectedIdSignature = this.id;
  idFilter.value = selectedIdSignature;
  selectButton.removeAttribute('disabled');
}


// Update the ID dropdown options based on the input ID fragment
function updateIdDropdown() {
  if(isSelected) {
    return;
  }

  let updatedDropdownItems = document.createDocumentFragment();
  let numberOfMatches = 0;
  let idFragment = idFilter.value;

  idSignatures.forEach(function(idSignature) {
    if(idSignature.includes(idFragment)) {
      let button = document.createElement('button');
      button.setAttribute('class', 'dropdown-item');
      button.setAttribute('type', 'button');
      button.setAttribute('id', idSignature);
      button.textContent = idSignature;
      button.addEventListener('click', selectIdentifierSignature);
      updatedDropdownItems.appendChild(button);
      numberOfMatches++;
    }
  });

  let header = document.createElement('h6');
  header.setAttribute('class', 'dropdown-header');
  header.textContent = 'Matching (' + numberOfMatches + ' of ' +
                       idSignatures.length + ')';
  updatedDropdownItems.prepend(header);

  idDropdown.innerHTML = '';
  idDropdown.appendChild(updatedDropdownItems);
  selectButton.textContent = 'Select';
}


// Reset the identifier
function resetId() {
  isSelected = false;
  idFilter.value = '';
  idFilter.removeAttribute('readonly');
  selectButton.textContent = 'Select';
  selectButton.setAttribute('disabled', 'disabled');
  raddecs = [];
  raddecTableBody.innerHTML = '';
  rssiTableBody.innerHTML = '';
}


// Update the selected transmitter data
function updateTransmitter(raddec) {
  raddecs.unshift(raddec);
  if(raddecs.length > RADDEC_HISTORY_LENGTH) {
    raddecs.pop();
    raddecTableBody.removeChild(raddecTableBody.lastChild);
  }
  insertRaddec(raddec);
  updateRssiSignatures(raddecs);
}


// Update the receiver data
function updateReceiver(raddec) {
  let receiverSignature = raddec.rssiSignature[0].receiverId +
                          SIGNATURE_SEPARATOR +
                          raddec.rssiSignature[0].receiverIdType;

  if(currentReceiverSignature !== receiverSignature) {
    currentReceiverSignature = receiverSignature;
    cormorant.retrieveAssociations(baseUrl, receiverSignature, false,
                                   function(associations) {
      if(associations && associations.hasOwnProperty('url')) {
        cormorant.retrieveStory(associations.url, function(story) {
          rxStoryJson.textContent = JSON.stringify(story, null, 2);
          cuttlefish.render(story, rxStoryVis);
        });
      }
    });
  } 
}


// Insert a raddec into the DOM as a <tr>
function insertRaddec(raddec) {
  let tr = document.createElement('tr');
  tr.setAttribute('class', 'monospace animated-highlight-reelyactive');

  appendTd(tr, new Date(raddec.timestamp).toLocaleTimeString(), 'text-center');
  appendTd(tr, prepareEvents(raddec), 'text-center');
  appendTd(tr, raddec.rssiSignature[0].receiverId, 'text-right');
  appendTd(tr, raddec.rssiSignature[0].rssi, 'text-right');
  appendTd(tr, prepareRecDecPac(raddec), 'text-center');

  raddecTableBody.prepend(tr);
}


// Update rssiSignatures table
function updateRssiSignatures() {
  let receiverHistories = [];
  let updatedTable = document.createDocumentFragment();

  raddecs.forEach(function(raddec, index) {
    raddec.rssiSignature.forEach(function(element) {
      if(index === 0) {
        receiverHistories.push({ receiverId: element.receiverId,
                                 rssiHistory: [ element.rssi ] });
      }
      else {
        let isKnownReceiver = false;
        receiverHistories.forEach(function(receiverHistory) {
          if(receiverHistory.receiverId === element.receiverId) {
            isKnownReceiver = true;
            if(Array.isArray(receiverHistory.rssiHistory)) {
            receiverHistory.rssiHistory.push(element.rssi);
            }
            else { console.log(element.receiverId, receiverHistory); }
          }
        });
        if(!isKnownReceiver) {
          let rssiHistory = Array(index).fill(null);
          rssiHistory.push(element.rssi);
          receiverHistories.push({ receiverId: element.receiverId,
                                   rssiHistory: rssiHistory });       
        }
      }
    });
    receiverHistories.forEach(function(receiverHistory) {
      if(receiverHistory.rssiHistory.length < (index + 1)) {
        receiverHistory.rssiHistory.push(null);
      }
    });
  });

  receiverHistories.forEach(function(receiverHistory) {
    let tr = document.createElement('tr');
    tr.setAttribute('class', 'monospace');
    appendTd(tr, receiverHistory.receiverId, 'text-right');

    receiverHistory.rssiHistory.forEach(function(rssi, index) {
      if(index === 0) {
        appendTd(tr, rssi, 'text-right animated-highlight-reelyactive');
      }
      else {
        appendTd(tr, rssi, 'text-right');
      }
    });

    updatedTable.append(tr);
  });

  rssiTableBody.innerHTML = '';
  rssiTableBody.appendChild(updatedTable);
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

// Prepare the receivers-decodings-packets string
function prepareRecDecPac(raddec) {
  let maxNumberOfDecodings = 0;

  raddec.rssiSignature.forEach(function(signature) {
    if(signature.numberOfDecodings > maxNumberOfDecodings) {
      maxNumberOfDecodings = signature.numberOfDecodings;
    }
  });

  return raddec.rssiSignature.length + RDPS + maxNumberOfDecodings + RDPS +
         raddec.packets.length;
}


// Fetch the device associations and story, update entry fields
function fetchAndUpdateStoryEntry() {
  isSelected = true;
  idFilter.setAttribute('readonly', 'readonly');
  idDropdown.innerHTML = '';

  cormorant.retrieveAssociations(baseUrl, selectedIdSignature, false,
                                 function(associations) {
    selectButton.setAttribute('disabled', 'disabled');
    selectButton.textContent = 'Selected';

    if(associations && associations.hasOwnProperty('url')) {
      cormorant.retrieveStory(associations.url, function(story) {
        txStoryJson.textContent = JSON.stringify(story, null, 2);
        cuttlefish.render(story, txStoryVis);
      });
    }
  });
}


// Event listeners
idFilter.addEventListener('keyup', updateIdDropdown);
resetButton.addEventListener('click', resetId);
selectButton.addEventListener('click', fetchAndUpdateStoryEntry);
