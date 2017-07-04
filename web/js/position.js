/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


// Constant definitions
DEFAULT_UPDATE_MILLISECONDS = 15000;
BASE_MAP_URL = 'http://www.openstreetmap.org/export/embed.html?bbox=';
DEFAULT_DEGREES_MARGIN = 0.01;


/**
 * position Module
 * All of the JavaScript specific to the position is contained inside this
 * angular module.  The only external dependencies are:
 * - ui-bootstrap (Google)
 */
angular.module('position', ['ui.bootstrap'])


/**
 * PositionCtrl Controller
 * Handles the manipulation of all variables accessed by the HTML view.
 */
.controller('PositionCtrl', function($scope, $location, $interval, $http, $sce) {

  // Variables accessible in the HTML scope
  $scope.position = null;
  $scope.mapUrl = null;

  // Variables accessible in the local scope
  var updateSeconds = DEFAULT_UPDATE_MILLISECONDS / 1000;
  var degreesMargin = DEFAULT_DEGREES_MARGIN;
  var url = $location.protocol() + '://' + $location.host() + ':' +
            $location.port() + '/gps';

  // Update the position
  function updatePosition() {
    $http({ method: 'GET', url: url })
      .then(function(response) { // Success
        $scope.position = response.data.gps;
        $scope.position.lastFixLocal =
                        new Date($scope.position.lastFix).toLocaleTimeString();
        updateMapUrl(response.data.gps);
      }, function(response) {    // Error
        $scope.position = null;
        console.log("GPS not enabled");
    });
  }

  // Update the map URL
  function updateMapUrl(position) {
    var mapUrl = BASE_MAP_URL +
                 (position.lon - degreesMargin) + '%2C' +
                 (position.lat - degreesMargin) + '%2C' +
                 (position.lon + degreesMargin) + '%2C' +
                 (position.lat + degreesMargin) + '&amp;layer=mapnik';
    $scope.mapUrl = $sce.trustAsResourceUrl(mapUrl);
  }

  // Periodic update of display variables
  function periodicUpdate() {
    updatePosition();
  }

  // Update the map zoon
  $scope.updateZoom = function(zoom) {
    degreesMargin = zoom / 2;
  }

  // Update the update period
  $scope.updatePeriod = function(period) {
    if(period) {
      updateSeconds = period / 1000;
      $scope.updateMessage = "Updating every " + updateSeconds + "s";
      $interval.cancel($scope.updatePromise);
      $scope.updatePromise = $interval(periodicUpdate, period);
      periodicUpdate();
    }
    else {
      $scope.updateMessage = "Updates paused";
      $interval.cancel($scope.updatePromise);
    }
  };

  $scope.updatePeriod(DEFAULT_UPDATE_MILLISECONDS);
});
