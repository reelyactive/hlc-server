angular.module("adminpanel", [ 'ui.bootstrap' ])

  // Association controller
  .controller("AssociationCtrl", function($scope, $http) {
    $scope.association = { };
    $scope.alerts = [];

    // ----- GET /associations/{id} -----
    $scope.association.get = function(item, event) {
      var url = '../associations/' + $scope.association.id;

      $http({ method: 'GET', url: url })
        .then(function(response) { // Success
          var standardisedID = Object.keys(response.data.devices)[0];
          var association = response.data.devices[standardisedID];
          $scope.association.url = association.url;
          $scope.association.tags = association.tags;
          $scope.association.directory = association.directory;
          var message = 'Successfully retrieved ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not retrieve ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- PUT /associations/{id} -----
    $scope.association.put = function(item, event) {
      var json = {};
      var url = '../associations/' + $scope.association.id;

      if($scope.association.url !== '') {
        json.url = $scope.association.url;
      }
      if($scope.association.tags !== '') {
        json.tags = $scope.association.tags;
      }
      if($scope.association.directory !== '') {
        json.directory = $scope.association.directory;
      }
      if(Object.keys(json).length === 0) {
        var message = 'Did not replace ' + $scope.association.id +
                      ', enter at least one field (URL, Tags and/or Directory).';
        $scope.alerts.push( { type: 'danger', message: message } );
        return;
      }

      $http({ method: 'PUT', url: url, data: json })
        .then(function(response) { // Success
          var message = 'Successfully replaced ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not replace ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- DELETE /associations/{id} -----
    $scope.association.delete = function(item, event) {
      var url = '../associations/' + $scope.association.id;

      $http({ method: 'DELETE', url: url })
        .then(function(response) { // Success
          $scope.association.url = '';
          $scope.association.tags = '';
          $scope.association.directory = '';
          var message = 'Successfully deleted ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not delete ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- GET /associations/{id}/url -----
    $scope.association.getUrl = function(item, event) {
      var url = '../associations/' + $scope.association.id + '/url';

      $http({ method: 'GET', url: url })
        .then(function(response) { // Success
          var standardisedID = Object.keys(response.data.devices)[0];
          var association = response.data.devices[standardisedID];
          $scope.association.url = association.url;
          var message = 'Successfully retrieved URL of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not retrieve URL of ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- PUT /associations/{id}/url -----
    $scope.association.putUrl = function(item, event) {
      if((typeof($scope.association.url) === 'undefined') ||
         ($scope.association.url === '')) {
        var message = 'Cannot replace URL of ' + $scope.association.id +
                      ', URL field is empty.';
        $scope.alerts.push( { type: 'danger', message: message } );
        return;
      }

      var json = { url: $scope.association.url };
      var url = '../associations/' + $scope.association.id + '/url';

      $http({ method: 'PUT', url: url, data: json })
        .then(function(response) { // Success
          var message = 'Successfully replaced URL of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not replace URL of ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- DELETE /associations/{id}/url -----
    $scope.association.deleteUrl = function(item, event) {
      var url = '../associations/' + $scope.association.id + '/url';

      $http({ method: 'DELETE', url: url })
        .then(function(response) { // Success
          $scope.association.url = '';
          var message = 'Successfully deleted URL of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not delete URL of ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- GET /associations/{id}/tags -----
    $scope.association.getTags = function(item, event) {
      var url = '../associations/' + $scope.association.id + '/tags';

      $http({ method: 'GET', url: url })
        .then(function(response) { // Success
          var standardisedID = Object.keys(response.data.devices)[0];
          var association = response.data.devices[standardisedID];
          $scope.association.tags = association.tags;
          var message = 'Successfully retrieved tags of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not retrieve tags of ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- PUT /associations/{id}/tags -----
    $scope.association.putTags = function(item, event) {
      if((typeof($scope.association.tags) === 'undefined') ||
         ($scope.association.tags === '')) {
        var message = 'Cannot replace tags of ' + $scope.association.id +
                      ', tags field is empty.';
        $scope.alerts.push( { type: 'danger', message: message } );
        return;
      }

      var json = { tags: $scope.association.tags };
      var url = '../associations/' + $scope.association.id + '/tags';

      $http({ method: 'PUT', url: url, data: json })
        .then(function(response) { // Success
          var message = 'Successfully replaced tags of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not replace tags of ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- DELETE /associations/{id}/tags -----
    $scope.association.deleteTags = function(item, event) {
      var url = '../associations/' + $scope.association.id + '/tags';

      $http({ method: 'DELETE', url: url })
        .then(function(response) { // Success
          $scope.association.tags = '';
          var message = 'Successfully deleted tags of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not delete tags of ' + $scope.association.id +
                        ', Status code ' + response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- GET /associations/{id}/directory -----
    $scope.association.getDirectory = function(item, event) {
      var url = '../associations/' + $scope.association.id + '/directory';

      $http({ method: 'GET', url: url })
        .then(function(response) { // Success
          var standardisedID = Object.keys(response.data.devices)[0];
          var association = response.data.devices[standardisedID];
          $scope.association.directory = association.directory;
          var message = 'Successfully retrieved directory of ' +
                        $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not retrieve directory of ' +
                        $scope.association.id + ', Status code ' +
                        response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- PUT /associations/{id}/directory -----
    $scope.association.putDirectory = function(item, event) {
      if((typeof($scope.association.directory) === 'undefined') ||
         ($scope.association.directory === '')) {
        var message = 'Cannot replace directory of ' + $scope.association.id +
                      ', directory field is empty.';
        $scope.alerts.push( { type: 'danger', message: message } );
        return;
      }

      var json = { directory: $scope.association.directory };
      var url = '../associations/' + $scope.association.id + '/directory';

      $http({ method: 'PUT', url: url, data: json })
        .then(function(response) { // Success
          var message = 'Successfully replaced directory of ' +
                        $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not replace directory of ' +
                        $scope.association.id + ', Status code ' +
                        response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    // ----- DELETE /associations/{id}/directory -----
    $scope.association.deleteDirectory = function(item, event) {
      var url = '../associations/' + $scope.association.id + '/directory';

      $http({ method: 'DELETE', url: url })
        .then(function(response) { // Success
          $scope.association.directory = '';
          var message = 'Successfully deleted directory of ' +
                        $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        }, function(response) {    // Error
          var message = 'Could not delete directory of ' +
                        $scope.association.id + ', Status code ' +
                        response.status;
          $scope.alerts.push( { type: 'danger', message: message } );
      });
    };

    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

  });
