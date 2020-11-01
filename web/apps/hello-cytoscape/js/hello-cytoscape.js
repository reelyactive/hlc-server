/**
 * Copyright reelyActive 2020
 * We believe in an open Internet of Things
 */


// Constant definitions
const DEFAULT_RSSI_THRESHOLD = -70;
const DEFAULT_LAYOUT_INTERVAL = 5000;
const SIGNATURE_SEPARATOR = '/';
const COSE_LAYOUT_OPTIONS = {
    name: "cose",
    animate: false,
    randomize: false,
    initialTemp: 40
};
const CONCENTRIC_LAYOUT_OPTIONS = {
    name: "concentric",
    startAngle: 0,
    sweep: Math.PI,
    concentric: concentric
};
const BREADTHFIRST_LAYOUT_OPTIONS = {
    name: "breadthfirst"
};
const GRAPH_STYLE = [
    { selector: "node[type='transmitter']",
      style: { "background-color": "#83b7d0" } },
    { selector: "node[type='receiver']",
      style: { "background-color": "#aec844", label: "data(name)" } },
    { selector: "node[image]",
      style: { "background-image": "data(image)", "border-color": "#aec844",
               "background-fit": "cover cover", "border-width": "2px" } },
    { selector: "edge", style: { "curve-style": "haystack",
                                 "line-color": "#ddd" } },
];
const DEFAULT_STORY = {
  "@context": { "schema": "https://schema.org/" },
  "@graph": []
};
const DEFAULT_PERSON_ELEMENT = { "@id": "person", "@type": "schema:Person" };

// DOM elements


// Other variables
let rssiThreshold = DEFAULT_RSSI_THRESHOLD;
let layoutUpdateInterval = DEFAULT_LAYOUT_INTERVAL;
let isInitialLayoutPending = true;
let layoutOptions = COSE_LAYOUT_OPTIONS;
let layoutPromise;
let selectedReceiverId;
let selectedTransmitterId;
let nodeStory = Object.assign({}, DEFAULT_STORY);
let nodeElement = Object.assign({}, DEFAULT_PERSON_ELEMENT);


// Initialise Cytoscape
let cy = cytoscape({
  container: document.getElementById('cy'),
  layout: COSE_LAYOUT_OPTIONS,
  style: GRAPH_STYLE
});
let layout = cy.layout({ name: "cose", cy: cy });
cy.on("tap", "node[type='receiver']", handleReceiverTap);
cy.on("tap", "node[type='transmitter']", handleTransmitterTap);
cy.on("touchstart", "node[type='receiver']",handleReceiverHover);
cy.on("touchstart", "node[type='transmitter']",handleTransamitterHover);

//Initialize metadata
let metadata = document.getElementById('metadata');

//Add node metadata details
nodeStory['@graph'].push(nodeElement);

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Handle raddec events
beaver.on([ 0 ], addTransmitter);       // Appearance
beaver.on([ 1, 2 ], updateTransmitter); // Displacement or packets
beaver.on([ 4 ], removeTransmitter);    // Disappearance


// Add a transmitter node and its receiver edges
function addTransmitter(raddec) {
  let transmitterSignature = determineTransmitterSignature(raddec);
  let isExistingNode = (cy.getElementById(transmitterSignature).size() > 0);

  if(isExistingNode) {
    return updateTransmitter(raddec);
  }

  if(!isAboveRssiThreshold(raddec)) {
    return;
  }

  let renderedPosition = determineInitialRenderingPosition(raddec);

  cy.add({ group: "nodes", renderedPosition: renderedPosition,
           data: { id: transmitterSignature, type: 'transmitter' } });
  addReceiverEdges(raddec);

  if(isInitialLayoutPending) {
    updateLayout();
    isInitialLayoutPending = false;
  }
}


// Update an existing transmitter node's receiver edges
function updateTransmitter(raddec) {
  let transmitterSignature = determineTransmitterSignature(raddec);
  let isExistingNode = (cy.getElementById(transmitterSignature).size() > 0);

  if(!isExistingNode) {
    return addTransmitter(raddec);
  }

  if(!isAboveRssiThreshold(raddec)) {
    return removeTransmitter(raddec);
  }

  let transmitterEdges = cy.elements('edge[source = "' + transmitterSignature +
                                     '" ]');

  transmitterEdges.forEach(function(ele) {
    let receiverSignature = ele.data('target');
    let isPersistentEdge = false;

    raddec.rssiSignature.forEach(function(entry) {
      if((receiverSignature === determineReceiverSignature(entry)) &&
         (entry.rssi >= rssiThreshold)) {
        isPersisentEdge = true;
      }
    });

    if(!isPersistentEdge) {
      cy.remove(ele);
    }
  });

  addReceiverEdges(raddec);
  removeOrphanNodes();
}


// Remove the transmitter and its edges
function removeTransmitter(raddec) {
  let transmitterSignature = determineTransmitterSignature(raddec);
  let transmitter = cy.getElementById(transmitterSignature);
  let transmitterEdges = cy.elements('edge[source = "' + transmitterSignature +
                                     '" ]');
  cy.remove(transmitterEdges);
  cy.remove(transmitter);
  removeOrphanNodes();
}


// Add the edges, and, if necessary, receiver node, for the given raddec
function addReceiverEdges(raddec) {
  let transmitterSignature = determineTransmitterSignature(raddec);

  raddec.rssiSignature.forEach(function(entry) {
    let receiverSignature = determineReceiverSignature(entry);
    let edgeSignature = transmitterSignature + '@' + receiverSignature;
    isExistingNode = (cy.getElementById(receiverSignature).size() > 0);
    isExistingEdge = (cy.getElementById(edgeSignature).size() > 0);

    if(entry.rssi >= rssiThreshold) {
      if(!isExistingNode) {
        let receiverName = entry.receiverId.substr(-2);
        cy.add({ group: "nodes", data: { id: receiverSignature,
                                         type: 'receiver',
                                         name: receiverName } });
        fetchContextAndUpdateNode(receiverSignature);
      }
      if(!isExistingEdge) {
        cy.add({ group: "edges", data: { id: edgeSignature,
                                         source: transmitterSignature,
                                         target: receiverSignature } });
      }
    }
  });
}


// Remove any nodes that have no edges
function removeOrphanNodes() {
  cy.nodes(function(node) {
    if(node.degree() < 1) {
      cy.remove(node);
    }
  });
}


// Fetch the context for the given ID signature and update the node
function fetchContextAndUpdateNode(signature) {
  cormorant.retrieveAssociations(baseUrl, signature, true,
                                 function(associations, story) {
    if(story) {
      let title = cuttlefish.determineTitle(story);
      let imageUrl = cuttlefish.determineImageUrl(story);
      let node = cy.getElementById(signature);

      if(node && imageUrl) {
        node.data('image', imageUrl);
        node.data('name', '');
      }
      else if(node && title) {
        node.data('name', title);
      }
    }
  });
}


// Determine the transmitter signature for the given raddec
function determineTransmitterSignature(raddec) {
  return raddec.transmitterId + SIGNATURE_SEPARATOR + raddec.transmitterIdType;
}


// Determine the strongest receiver signature for the given raddec
function determineReceiverSignature(entry) {
  return entry.receiverId + SIGNATURE_SEPARATOR + entry.receiverIdType;
}


// Determine an initial rendering position for the given raddec
function determineInitialRenderingPosition(raddec) {
  if(!Array.isArray(raddec.rssiSignature) ||
     (raddec.rssiSignature.length < 1)) {
    return { x: 0, y: 0 };
  }

  let receiverSignature = determineReceiverSignature(raddec.rssiSignature[0]);
  let receiverNode = cy.getElementById(receiverSignature);
  let isExistingNode = (receiverNode.size() > 0);

  if(!isExistingNode) {
    return { x: 0, y: 0 };
  }

  let receiverX = receiverNode.renderedPosition('x') || 0;
  let receiverY = receiverNode.renderedPosition('y') || 0;
  let receiverW = receiverNode.renderedWidth() || 50;
  let randomRadians = Math.random() * Math.PI * 2;

  return { x: receiverX + (Math.cos(randomRadians) * receiverW),
           y: receiverY + (Math.sin(randomRadians) * receiverW) };
}


// Determine if the strongest receiver is above the RSSI threshold
function isAboveRssiThreshold(raddec) {
  return (Array.isArray(raddec.rssiSignature) &&
          (raddec.rssiSignature.length > 0) &&
          (raddec.rssiSignature[0].rssi >= rssiThreshold));
}


// Determine the level of the given node in the concentric layout
function concentric(node) {
  if(node.id() === selectedReceiverId) {
    return 100;
  }

  return 0;
}


// Handle the tap of a receiver node
function handleReceiverTap(evt) {
  let node = evt.target;

  let isNewSelectedReceiver = (node.id() !== selectedReceiverId);

  if(isNewSelectedReceiver) {
    selectedReceiverId = node.id();
    updateLayout(CONCENTRIC_LAYOUT_OPTIONS);
  }
  else if(layoutOptions.name === 'concentric') {
    updateLayout(COSE_LAYOUT_OPTIONS);
  }
  else {
    updateLayout(CONCENTRIC_LAYOUT_OPTIONS);
  }
}


// Handle the tap of a transmitter node
function handleTransmitterTap(evt) {
  let node = evt.target;

  let isNewSelectedTransmitter = (node.id() !== selectedTransmitterId);
  let breadthfirstLayoutOptions = Object.assign({ roots: node },
                                                BREADTHFIRST_LAYOUT_OPTIONS);

  if(isNewSelectedTransmitter) {
    selectedTransmitterId = node.id();
    updateLayout(breadthfirstLayoutOptions);
  }
  else if(layoutOptions.name === 'breadthfirst') {
    updateLayout(COSE_LAYOUT_OPTIONS);
  }
  else {
    updateLayout(breadthfirstLayoutOptions);
  }
}


// Update the layout and set a timeout for the next update
function updateLayout(newLayoutOptions) {
  if(newLayoutOptions) {
    layoutOptions = newLayoutOptions;
    clearTimeout(layoutPromise);
  }

  layout.stop();
  layout = cy.elements().makeLayout(layoutOptions);
  layout.run();
  layoutPromise = setTimeout(updateLayout, layoutUpdateInterval);
}


// Handle the hover on a receiver node
function handleReceiverHover(evt) {
  let node = evt.target;
  let isNewSelectedReceiver = (node.id() !== selectedReceiverId);
  nodeElement['schema:name'] = node.id();
  cuttlefish.render(nodeStory, metadata);
}


//Handle the hover on a transmitter node
function handleTransamitterHover(evt){
  let node = evt.target;
  let isNewSelectedTransmitter = (node.id() !== selectedTransmitterId);
  nodeElement['schema:name'] = node.id();
  cuttlefish.render(nodeStory, metadata);
}