/**
 * Copyright reelyActive 2017-2018
 * We believe in an open Internet of Things
 */


DEFAULT_SOCKET_URL = 'https://pareto.reelyactive.com/';
DEFAULT_SAMPLE_PERIOD = 5000;
DEFAULT_INITIAL_DELAY = 1000;
DEFAULT_BEAVER_OPTIONS = {
  disappearanceMilliseconds: 60000,
  mergeEvents: true,
  mergeEventProperties: [ 'event', 'time', 'rssi', 'receiverId',
                          'receiverDirectory', 'receiverUrl' ],
  retainEventProperties: [ 'event', 'time', 'rssi', 'deviceId', 'deviceUrl',
                           'deviceTags', 'receiverId', 'receiverDirectory',
                           'receiverUrl' ],
  maintainDirectories: true,
  observeOnlyFiltered: true,
  filters: { minSessionDuration: 60000 }
};
TRACK_TAG = 'track';

MAX_ACTIVE_AREAS = 4;

activeAreas = [];
palette = ['aqua', 'yellow', 'magenta', 'indigo'];


/**
 * live-directory Module
 * All of the JavaScript specific to the live-directory app is contained inside
 * this angular module.  The only external dependencies are:
 * - beaver, cormorant, cuttlefish, examples (reelyActive)
 */
angular.module('live-directory', [ 'reelyactive.beaver',
                                   'reelyactive.cormorant',
                                   'reelyactive.cuttlefish',
                                   'reelyactive.examples' ])

  /**
   * Config
   * Enable HTML5 mode.
   */
  .config(function($locationProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
  })


  /**
   * EventsCtrl Controller
   * Handles the manipulation of all variables accessed by the HTML view.
   */
  .controller('EventsCtrl', function($scope, $location, $interval, $timeout,
                                     $rootScope, beaver, cormorant, examples) {
    const example = $location.search().example;
    var socket;
    var directories = beaver.getDirectories();
    var activeAreaIDs = [];

    // Variables accessible in the HTML scope
    $scope.occupiedAreas = [];
    $rootScope.updates = 0;

    // Generate example if example query is present
    if(example) {
      examples.generate(example);
      socket = examples;
    }

    // Otherwise connect to websocket
    else {
      var url = $location.protocol() + '://' + $location.host() + ':' +
                $location.port();
      socket = io.connect(url);
      socket.on('connect', function() {
        console.log('live-directory connected to', url);
      });
    }

    beaver.listen(socket, DEFAULT_BEAVER_OPTIONS);
    beaver.on('appearance', prefetchDeviceStory);

    // Begin the process of updating the directories periodically
    $timeout(updateDirectories, DEFAULT_INITIAL_DELAY, true,
             DEFAULT_SAMPLE_PERIOD);

    // Pre-fetch the device story, if not already present
    function prefetchDeviceStory(event) {
      if(!event.hasOwnProperty('story')) {
        cormorant.getStory(event.deviceUrl, function(story, url) { });
      }
    }
    
    function renderLayout() {
      var numActiveAreas = activeAreas.length;
      if (numActiveAreas > 0) {
        createLayout(numActiveAreas);
      }
      updateLayout();
    }

    // Update the directories and their occupants,
    // and schedule the next update after the given period
    function updateDirectories(period) {
      var directoryArray = [];

      for(id in directories) {
        var directory = directories[id];
        directory.id = id.replace(/:/g,'');
        directoryArray.push(updateDirectory(directory));
      }

      activeAreas = directoryArray.filter(function(area, i, a) {
        return area.occupants.length > 0;
      }).sort(compareDirectories).slice(0, MAX_ACTIVE_AREAS);

      $scope.occupiedAreas = activeAreas;
      $rootScope.updates++;

      areaIDs = activeAreas.map(a => a.id);

      $timeout(function() {
        if(areaIDs.sort().join(',') !== activeAreaIDs.sort().join(',')) {
          renderLayout();
        }
        else {
          updateLayout();
        }
        activeAreaIDs = areaIDs;
      }); 

      // Schedule the next update after the given period (if any)
      if(period) {
        $interval(updateDirectories, period, 1, true, period);
      }
    }

    // Update and return the given directory and its occupants
    function updateDirectory(directory) {
      if(!directory.hasOwnProperty('story')) {
        var url = getDirectoryUrl(directory);
        cormorant.getStory(url, function(story, url) {
          directory.story = story;
          directory.name = getStoryName(story);
          directory.image = getStoryImage(story);
        });
      }

      directory.occupants = [];

      for(id in directory.devices) {
        var device = directory.devices[id];
        if(device.event.hasOwnProperty('story')) {
          updateOccupants(directory.occupants, device.event);
        }
        else {
          cormorant.getStory(device.event.deviceUrl, function(story, url) {
            device.event.story = story;
            updateOccupants(directory.occupants, device.event);
          });
        }
      }
      return directory;
    }

    // Compare the two given directories by their number of occupants
    function compareDirectories(a,b) {
      if (a.occupants.length > b.occupants.length)
        return -1;
      if (a.occupants.length < b.occupants.length)
        return 1;
      return 0;
    }

    // Return the most prevalent URL among receivers in the directory
    function getDirectoryUrl(directory) {
      var urls = {};
      var topUrl;
      var topCount = 0;

      for(id in directory.receivers) {
        var receiverUrl = directory.receivers[id].receiverUrl;
        if(urls.hasOwnProperty(receiverUrl)) {
          urls[receiverUrl].count++;
        }
        else {
          urls[receiverUrl] = { count: 1 };
        }
      }

      for(url in urls) {
        if(urls[url].count > topCount) {
          topUrl = url;
          topCount = urls[url].count;
        }
      }

      return topUrl;
    }

    // Add the given event to the occupants if the criteria are met
    function updateOccupants(occupants, event) {
      if(includesPerson(event.story) || isTagged(event)) {
        occupants.push(event.story);
      }
    }

    // Does the device have a 'track' tag?
    function isTagged(event) {
      return (event.deviceTags.indexOf(TRACK_TAG) >= 0);
    }

    // Does the given story include a person?
    function includesPerson(story) {
      if(isStandardStoryFormat(story)) {
        if(story['@graph'][0]['@type'] === 'schema:Person') {
          return true;
        }
      }
      return false;
    }

    // Get the most pertinent name from the given story
    function getStoryName(story) {
      if(isStandardStoryFormat(story)) {
        if(story['@graph'][0]['schema:givenName'] ||
           story['@graph'][0]['schema:familyName']) {
           return (story['@graph'][0]['schema:givenName'] || '') + ' ' +
                  (story['@graph'][0]['schema:familyName'] || '');
        }
        return story['@graph'][0]['schema:name'] || null;
      }
      return null;
    }

    // Get the most pertinent image from the given story
    function getStoryImage(story) {
      if(isStandardStoryFormat(story)) {
        return story['@graph'][0]['schema:image'] ||
               story['@graph'][0]['schema:logo'];
      }
      return null;
    }

    // Is the given story in the standard format?
    function isStandardStoryFormat(story) {
      if(story && 
         story.hasOwnProperty('@graph') &&
         Array.isArray(story['@graph'])) {
        return true;
      }
      return false;
    }

  });


function selectColor(colorIndex) {
  var paletteIndex = colorIndex % palette.length;
  return palette[paletteIndex];
}

function createLayout(numAreas) {

  var layout = $('.layout');

  var areaDiv = $('<div></div>').addClass('area-box');
  var bgDiv = $('<div></div>').addClass('area-bg');
  var fullDiv = areaDiv.clone().addClass('full');
  var halfDiv = areaDiv.clone().addClass('half');
  var quarterDiv = areaDiv.clone().addClass('quarter');

  layout.empty();
  
  function activate(div) {
    div.addClass('active');
    div.append(bgDiv.clone());
    return div;
  }

  if (numAreas >= 1) {
    layout.append(fullDiv.clone());
    var full = $('.full', layout);
    if (numAreas >= 2) {
      var leftHalf = halfDiv.clone();
      var rightHalf = halfDiv.clone();
      full.append(leftHalf);
      full.append(rightHalf);
      if (numAreas >= 3) {
        var quarter = activate(quarterDiv);
        rightHalf.append(quarter.clone());
        rightHalf.append(quarter.clone());
        if (numAreas >= 4) {
          leftHalf.append(quarter.clone());
          leftHalf.append(quarter.clone());
        } else {
          activate(leftHalf);
        }
      } else {
        activate(leftHalf);
        activate(rightHalf);
      }
    } else {
      activate(full);
    }

    $('.active').each(function(index) {
      var color = selectColor(index);
      $(this).addClass(color);
    });
  }

}

function fillArea(box, area) {
  $('.area-bg', box).css({backgroundImage: 'url('+area.image+')'});
  var freshContent = $('#'+area.id, '.directories').clone();
//  console.log($('.bubble', freshContent));
  var existingContent = $('.area-content', box);
  if (existingContent.length > 0) {
    existingContent.replaceWith(freshContent);
  } else {
    box.append(freshContent);
  }
//  box.addClass('filled');
}

function updateLayout() {
  $('.active').each(function(index) {
    var area = activeAreas[index];
    if (area.hasOwnProperty('image')) {
      fillArea($(this), area);
    }
  });
}
