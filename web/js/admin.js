angular.module("adminpanel", [ 'ui.bootstrap' ])

  // Association controller
  .controller("AssociationCtrl", function($scope, $http) {
    $scope.association = { };
    $scope.alerts = [];

    // ----- GET /associations/{id} -----
    $scope.association.get = function(item, event) {

      $http.get('../associations/' + $scope.association.id)
        .success(function(data, status, headers, config) {
          var association = data.devices[$scope.association.id];
          $scope.association.url = association.url;
          $scope.association.tags = association.tags;
          $scope.association.directory = association.directory;
          var message = 'Successfully retrieved ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not retrieve ' + $scope.association.id +
                        ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    // ----- PUT /associations/{id} -----
    $scope.association.put = function(item, event) {
      var json = {};
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

      $http.put('../associations/' + $scope.association.id, json)
        .success(function(data, status, headers, config) {
          var message = 'Successfully replaced ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not replace ' + $scope.association.id +
                        ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    // ----- DELETE /associations/{id} -----
    $scope.association.delete = function(item, event) {

      $http.delete('../associations/' + $scope.association.id)
        .success(function(data, status, headers, config) {
          $scope.association.url = '';
          $scope.association.tags = '';
          $scope.association.directory = '';
          var message = 'Successfully deleted ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not delete ' + $scope.association.id +
                        ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    // ----- GET /associations/{id}/url -----
    $scope.association.getUrl = function(item, event) {

      $http.get('../associations/' + $scope.association.id + '/url')
        .success(function(data, status, headers, config) {
          var association = data.devices[$scope.association.id];
          $scope.association.url = association.url;
          var message = 'Successfully retrieved URL of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not retrieve URL of ' + $scope.association.id +
                        ', Status code ' + status;
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

      $http.put('../associations/' + $scope.association.id + '/url', json)
        .success(function(data, status, headers, config) {
          var message = 'Successfully replaced URL of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not replace URL of ' + $scope.association.id +
                        ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    // ----- DELETE /associations/{id}/url -----
    $scope.association.deleteUrl = function(item, event) {

      $http.delete('../associations/' + $scope.association.id + '/url')
        .success(function(data, status, headers, config) {
          $scope.association.url = '';
          var message = 'Successfully deleted URL of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not delete URL of ' + $scope.association.id +
                        ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    // ----- GET /associations/{id}/tags -----
    $scope.association.getTags = function(item, event) {

      $http.get('../associations/' + $scope.association.id + '/tags')
        .success(function(data, status, headers, config) {
          var association = data.devices[$scope.association.id];
          $scope.association.tags = association.tags;
          var message = 'Successfully retrieved tags of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not retrieve tags of ' + $scope.association.id +
                        ', Status code ' + status;
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

      $http.put('../associations/' + $scope.association.id + '/tags', json)
        .success(function(data, status, headers, config) {
          var message = 'Successfully replaced tags of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not replace tags of ' + $scope.association.id +
                        ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    // ----- DELETE /associations/{id}/tags -----
    $scope.association.deleteTags = function(item, event) {

      $http.delete('../associations/' + $scope.association.id + '/tags')
        .success(function(data, status, headers, config) {
          $scope.association.tags = '';
          var message = 'Successfully deleted tags of ' + $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not delete tags of ' + $scope.association.id +
                        ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    // ----- GET /associations/{id}/directory -----
    $scope.association.getDirectory = function(item, event) {

      $http.get('../associations/' + $scope.association.id + '/directory')
        .success(function(data, status, headers, config) {
          var association = data.devices[$scope.association.id];
          $scope.association.directory = association.directory;
          var message = 'Successfully retrieved directory of ' +
                        $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not retrieve directory of ' +
                        $scope.association.id + ', Status code ' + status;
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

      $http.put('../associations/' + $scope.association.id + '/directory', json)
        .success(function(data, status, headers, config) {
          var message = 'Successfully replaced directory of ' +
                        $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not replace directory of ' +
                        $scope.association.id + ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    // ----- DELETE /associations/{id}/directory -----
    $scope.association.deleteDirectory = function(item, event) {

      $http.delete('../associations/' + $scope.association.id + '/directory')
        .success(function(data, status, headers, config) {
          $scope.association.directory = '';
          var message = 'Successfully deleted directory of ' +
                        $scope.association.id;
          $scope.alerts.push( { type: 'success', message: message } );
        })
        .error(function(data, status, headers, config) {
          var message = 'Could not delete directory of ' +
                        $scope.association.id + ', Status code ' + status;
          $scope.alerts.push( { type: 'danger', message: message } );
        });
    };

    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };

  });
