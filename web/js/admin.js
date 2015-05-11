angular.module("adminpanel", [])

  // Association controller
  .controller("AssociationCtrl", function($scope, $http) {
    $scope.association = { };
    $scope.message = '';

    // ----- GET /associations/{id} -----
    $scope.association.get = function(item, event) {

      $http.get('../associations/' + $scope.association.id)
        .success(function(data, status, headers, config) {
          var association = data.devices[$scope.association.id];
          $scope.association.url = association.url;
          $scope.association.tags = association.tags;
          $scope.association.directory = association.directory;
          $scope.message = 'Successfully retrieved ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'GET FAILED. Status code ' + status;
        });
    }

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
        $scope.message = 'ERROR. Enter at least one field.';
        return;
      }

      $http.put('../associations/' + $scope.association.id, json)
        .success(function(data, status, headers, config) {
          $scope.message = 'Successfully updated ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'PUT FAILED. Status code ' + status;
        });
    }

    // ----- DELETE /associations/{id} -----
    $scope.association.delete = function(item, event) {

      $http.delete('../associations/' + $scope.association.id)
        .success(function(data, status, headers, config) {
          $scope.association.url = '';
          $scope.association.tags = '';
          $scope.association.directory = '';
          $scope.message = 'Successfully deleted ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'DELETE FAILED. Status code ' + status;
        });
    }

    // ----- GET /associations/{id}/url -----
    $scope.association.getUrl = function(item, event) {

      $http.get('../associations/' + $scope.association.id + '/url')
        .success(function(data, status, headers, config) {
          var association = data.devices[$scope.association.id];
          $scope.association.url = association.url;
          $scope.message = 'Successfully retrieved url of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'GET FAILED. Status code ' + status;
        });
    }

    // ----- PUT /associations/{id}/url -----
    $scope.association.putUrl = function(item, event) {
      if($scope.association.url === '') {
        $scope.message = 'ERROR. Enter a URL.';
        return;
      }

      var json = { url: $scope.association.url };

      $http.put('../associations/' + $scope.association.id + '/url', json)
        .success(function(data, status, headers, config) {
          $scope.message = 'Successfully updated url of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'PUT FAILED. Status code ' + status;
        });
    }

    // ----- DELETE /associations/{id}/url -----
    $scope.association.deleteUrl = function(item, event) {

      $http.delete('../associations/' + $scope.association.id + '/url')
        .success(function(data, status, headers, config) {
          $scope.association.url = '';
          $scope.message = 'Successfully deleted url of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'DELETE FAILED. Status code ' + status;
        });
    }

    // ----- GET /associations/{id}/tags -----
    $scope.association.getTags = function(item, event) {

      $http.get('../associations/' + $scope.association.id + '/tags')
        .success(function(data, status, headers, config) {
          var association = data.devices[$scope.association.id];
          $scope.association.tags = association.tags;
          $scope.message = 'Successfully retrieved tags of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'GET FAILED. Status code ' + status;
        });
    }

    // ----- PUT /associations/{id}/tags -----
    $scope.association.putTags = function(item, event) {
      if($scope.association.tags === '') {
        $scope.message = 'ERROR. Enter a tag.';
        return;
      }

      var json = { tags: $scope.association.tags };

      $http.put('../associations/' + $scope.association.id + '/tags', json)
        .success(function(data, status, headers, config) {
          $scope.message = 'Successfully updated tags of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'PUT FAILED. Status code ' + status;
        });
    }

    // ----- DELETE /associations/{id}/tags -----
    $scope.association.deleteTags = function(item, event) {

      $http.delete('../associations/' + $scope.association.id + '/tags')
        .success(function(data, status, headers, config) {
          $scope.association.tags = '';
          $scope.message = 'Successfully deleted tags of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'DELETE FAILED. Status code ' + status;
        });
    }

    // ----- GET /associations/{id}/directory -----
    $scope.association.getDirectory = function(item, event) {

      $http.get('../associations/' + $scope.association.id + '/directory')
        .success(function(data, status, headers, config) {
          var association = data.devices[$scope.association.id];
          $scope.association.directory = association.directory;
          $scope.message = 'Successfully retrieved directory of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'GET FAILED. Status code ' + status;
        });
    }

    // ----- PUT /associations/{id}/directory -----
    $scope.association.putDirectory = function(item, event) {
      if($scope.association.directory === '') {
        $scope.message = 'ERROR. Enter a directory.';
        return;
      }

      var json = { directory: $scope.association.directory };

      $http.put('../associations/' + $scope.association.id + '/directory', json)
        .success(function(data, status, headers, config) {
          $scope.message = 'Successfully updated directory of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'PUT FAILED. Status code ' + status;
        });
    }

    // ----- DELETE /associations/{id}/directory -----
    $scope.association.deleteDirectory = function(item, event) {

      $http.delete('../associations/' + $scope.association.id + '/directory')
        .success(function(data, status, headers, config) {
          $scope.association.directory = '';
          $scope.message = 'Successfully deleted directory of ' +
                           $scope.association.id;
        })
        .error(function(data, status, headers, config) {
          $scope.message = 'DELETE FAILED. Status code ' + status;
        });
    }
  });
