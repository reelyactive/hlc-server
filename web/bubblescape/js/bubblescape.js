/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */


/**
 * bubblescape Module
 * All of the JavaScript specific to the dashboard is contained inside this
 * angular module.  The only external dependencies are:
 * - beaver, cormorant and cuttlefish (reelyActive)
 * - socket.io (btford)
 * - ngSanitize (angular)
 */
angular.module('bubblescape', ['btford.socket-io', 'reelyactive.beaver',
                               'reelyactive.cormorant',
                               'reelyactive.cuttlefish', 'ngSanitize'])


/**
 * Socket Factory
 * Creates the websocket connection to the given URL using socket.io.
 */
.factory('Socket', function(socketFactory, $location) {
  var url = $location.protocol() + '://' + $location.host() + ':' +
            $location.port();
  return socketFactory({
    ioSocket: io.connect(url)
  });
})


/**
 * InteractionCtrl Controller
 * Handles the manipulation of all variables accessed by the HTML view.
 */
.controller('InteractionCtrl', function($scope, $attrs, Socket, beaver,
                                        cormorant) {

  // Variables accessible in the HTML scope
  $scope.devices = beaver.getDevices();
  $scope.stories = cormorant.getStories();
  $scope.visible = $attrs.visible;

  // beaver.js listens on the websocket for events
  beaver.listen(Socket, function() { return !Bubbles.areActive(); });

  // Handle events pre-processed by beaver.js
  beaver.on('appearance', function(event) {
    handleEvent(event);
  });
  beaver.on('displacement', function(event) {
    handleEvent(event);
  });
  beaver.on('keep-alive', function(event) {
    handleEvent(event);
  });
  beaver.on('disappearance', function(event) {
    handleEvent(event);
  });

  // Handle an event
  function handleEvent(event) {
    cormorant.getCombinedStory(event.deviceUrl, event.receiverUrl, function() {
    });
  }

  // Verify if the device's story has been fetched
  $scope.hasFetchedStory = function(device) {
    return $scope.stories.hasOwnProperty(device.event.deviceUrl);
  };

  // Get the story corresponding to the given device
  $scope.getStory = function(device) {
    return $scope.stories[device.event.deviceUrl];
  };
  
});
