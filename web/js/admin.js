angular.module("adminpanel", [])

  // Device controller
  .controller("deviceApi", function($scope, $http) {
    $scope.device = {};
    $scope.device.message = "";

    // ----- POST /id -----
    $scope.device.create = function(item, event) {
      var json = { identifier: $scope.device.identifier,
                   url: $scope.device.url };

      $http.post("../id", json)
        .success(function(data, status, headers, config) {
          $scope.device.message = "Successfully created " +
                                  $scope.device.identifier;
        })
        .error(function(data, status, headers, config) {
          alert("Could not create new association");
        });
    }

    // ----- PUT /id/identifier -----
    $scope.device.update = function(item, event) {
      var json = { identifier: $scope.device.identifier,
                   url: $scope.device.url };

      $http.put("../id/" + $scope.device.identifier, json)
        .success(function(data, status, headers, config) {
          $scope.device.message = "Successfully updated " +
                                  $scope.device.identifier;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }

    // ----- DELETE /id/identifier -----
    $scope.device.delete = function(item, event) {

      $http.delete("../id/" + $scope.device.identifier)
        .success(function(data, status, headers, config) {
          $scope.device.message = "Successfully deleted " +
                                  $scope.device.identifier;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }
  })

  // Place controller
  .controller("placeApi", function($scope, $http) {
    $scope.place = {};
    $scope.place.message = "";

    // ----- POST /place -----
    $scope.place.create = function(item, event) {
      var json = { place: $scope.place.place,
                   identifiers: $scope.place.identifiers };

      $http.post("../at", json)
        .success(function(data, status, headers, config) {
          $scope.place.message = "Successfully created " +
                                 $scope.place.place;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }

    // ----- PUT /at/place -----
    $scope.place.update = function(item, event) {
      var json = { identifiers: $scope.place.identifiers };

      $http.put("../at/" + $scope.place.place, json)
        .success(function(data, status, headers, config) {
          $scope.place.message = "Successfully updated " +
                                  $scope.place.place;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }


    // ----- DELETE /at/place -----
    $scope.place.delete = function(item, event) {

      $http.delete("../at/" + $scope.place.place)
        .success(function(data, status, headers, config) {
          $scope.place.message = "Successfully deleted " +
                                 $scope.place.place;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }
  });
