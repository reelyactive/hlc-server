STATISTICS_REFRESH_MILLISECONDS = 2000;

angular.module("landing", [])

  // Query controller
  .controller("QueryCtrl", function($scope, $window, $location) {
    $scope.routes = [
      { name: 'Context near', path: '/contextnear' },
      { name: 'Context at', path: '/contextat' },
      { name: 'Where is', path: '/whereis' },
      { name: 'What near', path: '/whatnear' },
      { name: 'What at', path: '/whatat' }
    ];
    $scope.parameters = [
      { name: 'transmitter id', path: '/transmitter' },
      { name: 'receiver id', path: '/receiver' },
      { name: 'tags', path: '/tags' },
      { name: 'directory', path: '/directory' }
    ];
    $scope.query = {
      identifier: '',
      route: $scope.routes[0],
      parameter: $scope.parameters[0]
    };

    // Update the pulldown menus based on the identifier
    function updatePulldowns(newIdentifier, oldIdentifier) {
      if(newIdentifier.indexOf(':') > -1) {
        $scope.query.route = $scope.routes[1];
        $scope.query.parameter = $scope.parameters[3];
      }
      else if(newIdentifier.match(/^[a-fA-F0-9]+$/)) {
        if(newIdentifier.match(/^001bc509408/)) {
          $scope.query.route = $scope.routes[1];
          $scope.query.parameter = $scope.parameters[1];
        }
        else {
          $scope.query.route = $scope.routes[0];
          $scope.query.parameter = $scope.parameters[0];
        }
      }
      else {
        $scope.query.route = $scope.routes[0];
        $scope.query.parameter = $scope.parameters[2];
      }
    }

    // Watch for changes in the identifier field
    $scope.$watch(function(scope) { return scope.query.identifier },
                  updatePulldowns);

    // Redirect on search button click
    $scope.query.search = function(item, event) {
      var absUrl = $location.absUrl();
      var origin = absUrl.substr(0, absUrl.lastIndexOf('/'));
      var route = $scope.query.route.path;
      var parameter = $scope.query.parameter.path;
      var identifier = '/' + $scope.query.identifier;
      $window.location.href = origin + route + parameter + identifier;
    }
  })


  // Statistics controller
  .controller("StatisticsCtrl", function($scope, $http, $interval) {
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
    $interval(updateStatistics, STATISTICS_REFRESH_MILLISECONDS);

  });
