/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const SIGNATURE_SEPARATOR = '/';
const STORIES_ROUTE = '/stories';
const IMAGES_ROUTE = '/images';
const ASSOCIATIONS_ROUTE = '/associations';
const URL_ROUTE = '/url';
const DEFAULT_IMAGE_PROPERTY_NAME = 'image';
const DEFAULT_STORY = {
    "@context": { "schema": "https://schema.org/" },
    "@graph": []
};
const DEFAULT_PERSON_ELEMENT = { "@id": "person", "@type": "schema:Person" };


// DOM elements
let idFilter = document.querySelector('#idFilter');
let idDropdown = document.querySelector('#idDropdown');
let resetButton = document.querySelector('#resetButton');
let selectButton = document.querySelector('#selectButton');
let storyActionTitle = document.querySelector('#storyActionTitle');
let personForm = document.querySelector('#personForm');
let personGivenName = document.querySelector('#personGivenName');
let personFamilyName = document.querySelector('#personFamilyName');
let personImageInput = document.querySelector('#personImageInput');
let storeStory = document.querySelector('#storeStory');
let storeButton = document.querySelector('#storeButton');
let accessStory = document.querySelector('#accessStory');
let copyButton = document.querySelector('#copyButton');
let visitButton = document.querySelector('#visitButton');
let associationsButton = document.querySelector('#associationsButton');
let visualPreview = document.querySelector('#visualPreview');
let storyPreview = document.querySelector('#storyPreview');


// Other variables
let idSignatures = [];
let selectedIdSignature;
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let personStory = Object.assign({}, DEFAULT_STORY);
let personElement = Object.assign({}, DEFAULT_PERSON_ELEMENT);
personStory['@graph'].push(personElement);
let personImgSrc;


// Connect to the socket.io stream and feed to beaver
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  let transmitterSignature = raddec.transmitterId +
                             SIGNATURE_SEPARATOR +
                             raddec.transmitterIdType;
  addIdentifierSignature(transmitterSignature);

  raddec.rssiSignature.forEach(function(item) {
    let receiverSignature = item.receiverId +
                            SIGNATURE_SEPARATOR +
                            item.receiverIdType;
    addIdentifierSignature(receiverSignature);
  });
});

// Disappearance events
beaver.on([ 4 ], function(raddec) {
  let transmitterSignature = raddec.transmitterId +
                             SIGNATURE_SEPARATOR +
                             raddec.transmitterIdType;
  removeIdentifierSignature(transmitterSignature);
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
  idFilter.value = '';
  selectButton.textContent = 'Select';
  selectButton.setAttribute('disabled', 'disabled');
  storeButton.setAttribute('disabled', 'disabled');
}


// Fetch the device associations and story, update entry fields
function fetchAndUpdateStoryEntry() {
  storyPreview.textContent = JSON.stringify(personStory, null, 2);
  cuttlefish.render(personStory, visualPreview);

  cormorant.retrieveAssociations(baseUrl, selectedIdSignature, false,
                                 function(associations) {
    storeButton.removeAttribute('disabled');
    selectButton.setAttribute('disabled', 'disabled');
    selectButton.textContent = 'Selected';

    if(associations && associations.hasOwnProperty('url')) {
      cormorant.retrieveStory(associations.url, function(story) {
        storyActionTitle.textContent = 'Replace existing story';
        storyPreview.textContent = JSON.stringify(story, null, 2);
        cuttlefish.render(story, visualPreview);
      });
    }
    else {
      storyActionTitle.textContent = 'Create a story';
    }
  });
}


// Update the person element
function updatePersonElement() {
  if(personGivenName.value === '') {
    delete personElement['schema:givenName'];
  }
  else {
    personElement['schema:givenName'] = personGivenName.value;
  }

  if(personFamilyName.value === '') {
    delete personElement['schema:familyName'];
  }
  else {
    personElement['schema:familyName'] = personFamilyName.value;
  }

  storyPreview.textContent = JSON.stringify(personStory, null, 2);
  cuttlefish.render(personStory, visualPreview);
}


// Update the person's image source based on the uploaded image
function updatePersonImageSrc() {
  let input = this;
  if(input.files && input.files[0]) {
    let reader = new FileReader();
    
    reader.onload = function(e) {
      personImgSrc = e.target.result;
      personElement['schema:image'] = personImgSrc;
      cuttlefish.render(personStory, visualPreview);
    }
    reader.readAsDataURL(input.files[0]);
  }
}


// Handle user request to publish and associate story
function publishAndAssociateStory() {
  storeStory.hidden = true;

  if(personImgSrc) {
    addImage(function(imageUrl) {
      if(imageUrl) {
        personElement['schema:image'] = imageUrl;
      }
      else { /* TODO: handle image errors */ }
      addStory(function(url) {
        addAssociation(url, function() {
          accessStory.hidden = false;
        });
      });
    });
  }
  else {
    addStory(function(url) {
      addAssociation(url, function() {
        accessStory.hidden = false;
      });
    });
  }
}


/**
 * Uploads an image to the file system
 * @param {callback} callback Function to call upon completion
 */
function addImage(callback) {
  let formData = new FormData();
  formData.append(DEFAULT_IMAGE_PROPERTY_NAME, personImageInput.files[0]);

  let httpRequest = new XMLHttpRequest();
  httpRequest.onload = function(oevent){
    if(httpRequest.status === 200) {
      let response = JSON.parse(httpRequest.responseText);
      let imageId = Object.keys(response.images)[0];
      let image = response.images[imageId];
      let url = response._links.self.href + '/' + imageId;
      error.textContent = '';
      return callback(url);
    }
    else if(httpRequest.status === 204) {
      error.textContent = 'wrong file format';
    }
    else if(httpRequest.status === 422) {
      error.textContent = 'We could not detect any file';
    }
    else {
      //textImage.textContent = 'something went wrong while uploading image';
    } 
    return callback();
  };
  httpRequest.open('POST', IMAGES_ROUTE, true);
  httpRequest.send(formData);  
} 


/**
 * Obtains story and sends it to the database
 * @param {callback} callback Function to call upon completion
 */
function addStory(callback) { 
  let httpRequest = new XMLHttpRequest();
  let personStoryString = JSON.stringify(personStory);
  httpRequest.onreadystatechange = function(){
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      if(httpRequest.status === 200) {
        let response = JSON.parse(httpRequest.responseText);
        let storyId = Object.keys(response.stories)[0];
        let story = response.stories[storyId];
        let url = response._links.self.href + '/' + storyId;
        storyUrl.value = url;
        visitButton.href = url;
        return callback(url);
      }
      return callback();
    }
  };
  httpRequest.open('POST', STORIES_ROUTE);
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send(personStoryString);
}


/**
 * Associates the story URL with the device identifier
 * @param {callback} callback Function to call upon completion
 */
function addAssociation(url, callback) {
  let httpRequest = new XMLHttpRequest();
  let associationsString = JSON.stringify({ url: url });
  let associationsUrl = baseUrl + ASSOCIATIONS_ROUTE + '/' +
                        selectedIdSignature + URL_ROUTE;
  httpRequest.onreadystatechange = function(){
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      if((httpRequest.status === 200) || (httpRequest.status === 201)) {
        // TODO: handle success
      }
      else {
        // TODO: handle error
      }
      associationsButton.href = baseUrl + ASSOCIATIONS_ROUTE + '/' +
                                selectedIdSignature;
      return callback(associationsUrl);
    }
  };
  httpRequest.open('PUT', associationsUrl);
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send(associationsString);
}


// Handle user request to copy the story URL
function copyStoryUrl() {
  storyUrl.select();
  document.execCommand('copy');
}


// Event listeners
idFilter.addEventListener('keyup', updateIdDropdown);
resetButton.addEventListener('click', resetId);
selectButton.addEventListener('click', fetchAndUpdateStoryEntry);
personForm.addEventListener('keyup', updatePersonElement);
personImageInput.addEventListener('change', updatePersonImageSrc);
storeButton.addEventListener('click', publishAndAssociateStory);
copyButton.addEventListener('click', copyStoryUrl);
