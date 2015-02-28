REFRESH_MILLISECONDS = 2000;

angular.module("landing", [])

  // Statistics controller
  .controller("statistics", function($scope, $http, $interval) {
    $scope.statistics = { devices: 0, tiraids: 0 };

    updateStatistics();

    function updateStatistics() {
      $http.get("statistics")
        .success(function(data, status, headers, config) {
          $scope.statistics = data.statistics;
        })
        .error(function(data, status, headers, config) {
          console.log("Couldn't retrieve real-time statistics");
        });
    }
    $interval(updateStatistics, REFRESH_MILLISECONDS);

  });
