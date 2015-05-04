angular.module("association", [])

  // Association controller
  .controller("AssociationCtrl", function($scope, $http, $window) {
    $scope.success = false;
    $scope.device = {};
    $scope.device.message = '';
    $scope.device.href = '';

    var url = $window.location.search.split("url=").pop().split('&').shift();
    var hasUrl = $window.location.search.indexOf("url=") != -1;
    if(hasUrl) {
      $scope.device.url = url;
      // TODO: make url field readonly
    }

    // ----- PUT /id/identifier -----
    $scope.device.update = function(item, event) {
      var json = { url: $scope.device.url };

      $http.put('../devices/' + $scope.device.identifier + '/association', json)
        .success(function(data, status, headers, config) {
          $scope.success = true;
          $scope.device.message = 'Successfully associated device';
          $scope.device.href = 'devices/' + $scope.device.identifier + '/context';
          $scope.device.query = 'Query /devices/' + $scope.device.identifier + ' now!';
        })
        .error(function(data, status, headers, config) {
          $scope.device.message = "FAILED. Status code " + status;
        });
    }
  });
