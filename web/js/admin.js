angular.module("adminpanel", [])

  // Devices controller
  .controller("deviceApi", function($scope, $http) {
    $scope.device = {};
    $scope.device.message = "";

    // ----- PUT /devices/id/association -----
    $scope.device.update = function(item, event) {
      var json = { url: $scope.device.url };

      $http.put("../devices/" + $scope.device.identifier + '/association', json)
        .success(function(data, status, headers, config) {
          $scope.device.message = "Successfully updated " +
                                  $scope.device.identifier;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }

    // ----- DELETE /devices/id/association -----
    $scope.device.delete = function(item, event) {

      $http.delete("../devices/" + $scope.device.identifier + '/association')
        .success(function(data, status, headers, config) {
          $scope.device.message = "Successfully deleted " +
                                  $scope.device.identifier;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }
  })

  // Places controller
  .controller("placeApi", function($scope, $http) {
    $scope.place = {};
    $scope.place.message = "";

    // ----- POST /places -----
    $scope.place.create = function(item, event) {
      var json = { name: $scope.place.place,
                   devices: [] };

      $http.post("../places", json)
        .success(function(data, status, headers, config) {
          $scope.place.message = "Successfully created " +
                                 $scope.place.place;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }

    // ----- DELETE /places/place -----
    $scope.place.delete = function(item, event) {

      $http.delete("../places/" + $scope.place.place)
        .success(function(data, status, headers, config) {
          $scope.place.message = "Successfully deleted " +
                                 $scope.place.place;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }

    // ----- PUT /places/place/devices/id -----
    $scope.place.updateDevice = function(item, event) {
      var json = { device: { type: "infrastructure" } };

      $http.put("../places/" + $scope.place.place + "/devices/" +
                $scope.place.device, json)
        .success(function(data, status, headers, config) {
          $scope.place.message = "Successfully added " +
                                 $scope.place.device + " to " +
                                 $scope.place.place;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }

    // ----- DELETE /places/place/devices/id -----
    $scope.place.deleteDevice = function(item, event) {

      $http.delete("../places/" + $scope.place.place + "/devices/" +
                $scope.place.device)
        .success(function(data, status, headers, config) {
          $scope.place.message = "Successfully deleted " +
                                  $scope.place.device + " from " +
                                  $scope.place.place;
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }
  });
