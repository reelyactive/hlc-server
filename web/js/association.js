angular.module("association", [])

  // Association controller
  .controller("AssociationCtrl", function($scope, $http) {
    $scope.success = false;
    $scope.device = {};
    $scope.device.message = '';
    $scope.device.href = '';

    // ----- PUT /id/identifier -----
    $scope.device.update = function(item, event) {
      var json = { identifier: $scope.device.identifier,
                   url: $scope.device.url };

      $http.put('../id/' + $scope.device.identifier, json)
        .success(function(data, status, headers, config) {
          $scope.success = true;
          $scope.device.message = 'Successfully associated device';
          $scope.device.href = 'id/' + $scope.device.identifier;
          $scope.device.query = 'Query /id/' + $scope.device.identifier + ' now!';
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }
  });
