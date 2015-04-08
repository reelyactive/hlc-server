REFRESH_MILLISECONDS = 2000;

angular.module('response', [])

  // API controller
  .controller('ApiCtrl', function($scope, $http, $interval, $window) {
    var url = $window.location.href;
    $scope.meta = { message: "loading", statusCode: "..." };
    $scope.links = { self: { href: url } };
    $scope.devices = {};

    updateQuery();

    function updateQuery() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http.get(url)
        .success(function(data, status, headers, config) {
          $scope.meta = data._meta;
          $scope.links = data._links;
          $scope.devices = data.devices;
        })
        .error(function(data, status, headers, config) {
          $scope.meta = data._meta;
          $scope.links = data._links;
          $scope.devices = {};
        });
    }
    $interval(updateQuery, REFRESH_MILLISECONDS);
  });
