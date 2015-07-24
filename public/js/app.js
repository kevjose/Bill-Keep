var app = angular.module('MuppetApp', ['ngMaterial','ui.router']);

app.constant('Options', {baseUrl: 'https://kevsbillapp.herokuapp.com'});

app.config(
		function($stateProvider, $urlRouterProvider){
			$stateProvider
            	.state('login', {
            		url: "/login",
            		templateUrl: "views/login.html",
            		controller: 'HomeCtrl'
            	})
            	.state('sheets', {
            		url: "/sheets/:id",
            		abstract: true,
            		templateUrl: "views/sheets.html",
            		controller: 'SheetsCtrl'
            	})
            	.state('sheets.overview', {
            		url: "/",
            		views: {
            			'menuContent': {
            				templateUrl: "views/sheets.overview.html",
            			}
            		}
            	})
            	.state('sheets.edit', {
            		url: "/edit",
            		views: {
            			'menuContent': {
            				templateUrl: "views/sheets.edit.html",
            			}
            		}
            	})
            	.state('sheets.friends', {
            		url: '/friends',
            		views: {
            			'menuContent': {
            				templateUrl: "views/sheets.friends.html",
            			}
            		}
            	})
            	.state('sheets.expenses', {
            		url: '/expenses',
            		views: {
            			'menuContent': {
            				templateUrl: "views/sheets.expenses.html",
            			}
            		}
            	})
            	.state('sheets.expenses.create', {
            		url: '/create',
            		views: {
            			'createExpense': {
            				templateUrl: "views/sheets.expenses.create.html",
            			}
            		}
            	});
			$urlRouterProvider.otherwise("/login");
		}
	);
app.controller('AppCtrl', ['$scope', '$mdSidenav', 
  function($scope, $mdSidenav) {
  $scope.selected = null;
  $scope.toggleSidenav = toggleSidenav;
  
  function toggleSidenav(name) {
    $mdSidenav(name).toggle();
  }
}]);

app.controller('HomeCtrl', ['$scope', '$http', '$location', '$state', 'SheetsService',
  '$mdSidenav',
  function HomeCtrl($scope, $http, $location, $state, SheetsService,$mdSidenav) {
    console.log("inside homecontroller");
    $scope.selected = null;
    $scope.toggleSidenav = toggleSidenav;
    
    function toggleSidenav(name) {
      $mdSidenav(name).toggle();
    }
    $scope.creationInProgress = false;

    $scope.createSheet = function() {
      $scope.creationInProgress = true

      SheetsService.create().then(function(data) {
        return $state.go('sheets.overview', {id: data.sheet_id});
      });
    };
  }
]);
app.controller('SheetsCtrl', ['$scope', '$location', '$state', '$stateParams', 
  'SheetsService', 'FriendsService', 'ExpensesService', 'BalanceService',
  '$mdSidenav',
  function SheetsCtrl($scope, $location, $state, $stateParams,
    SheetsService, FriendsService, ExpensesService, BalanceService,
    $mdSidenav) {
    console.log("inside sheetscontroller");
    $scope.selected = null;
    $scope.toggleSidenav = toggleSidenav;
    
    function toggleSidenav(name) {
      $mdSidenav(name).toggle();
    }

    $scope.sheet = {friends:[], expenses: []};
    $scope.url = $location.absUrl();
    var sheet_id = $stateParams.id;

    SheetsService.read(sheet_id).then(function(data) {
      $scope.sheet = data;
    })

    $scope.$watch('sheet.friends', function (newVal, oldVal) {
        $scope.balance = BalanceService.compute($scope.sheet);
    }, true);

    $scope.$watch('sheet.expenses', function (newVal, oldVal) {
        $scope.balance = BalanceService.compute($scope.sheet);
    }, true);

    //Date picker
    $scope.toggleMin = function() {
        $scope.minDate = $scope.minDate ? null : new Date();
      };
      $scope.toggleMin();

      $scope.today = function() {
        $scope.dt = new Date();
      };
      $scope.today();

    $scope.saveSheetName = function(name) {
      if (name != null && name.trim().length > 0) {

        SheetsService.update({_id: sheet_id, name: name.trim()}).then(function(data) {
          $scope.sheet.name = name.trim();
          return $state.go('sheets.overview', {id: $scope.sheet._id});
        });
      }
    }

    $scope.addFriend = function(name) {
      if (name != null && name.trim().length > 0) {
        var friend = {name: name.trim(), sheet_id: sheet_id};

        FriendsService.create(friend).then(function(data) {
          $scope.sheet.friends.push(data);
        });
      }
    }

    $scope.showFriendName = function(friendId) {
      var friends = $scope.sheet.friends;
      for (var i in friends) {
        if (friends[i]._id == friendId) {
          return friends[i].name;
        }
      }
    }

    $scope.showFriendNames = function(friendIds) {
      var friendNames = '';
      for (var i in friendIds) {
        friendNames += $scope.showFriendName(friendIds[i]);
        if (i < friendIds.length - 1) {
          friendNames += ', ';
        }
      }

      return friendNames;
    }

    $scope.showEditFriend = function(friend) {
      var friends = $scope.sheet.friends;
      for (var i in friends) {
        if (friends[i]._id == friend._id) {
          $scope.sheet.friends[i].editable = true;
        }
        else {
          if (friends[i].editable) {
            $scope.sheet.friends[i].editable = false;
          }
        }
      }
    }

    $scope.editFriend = function(newname, friend) {
      var friends = $scope.sheet.friends;

      if (newname == null || newname.trim() == friend.name || newname.trim().length == 0) {
        for (var i in friends) {
          $scope.sheet.friends[i].editable = false;
        }
        return ;
      }
      
      for (var i in friends) {
        if (friends[i]._id == friend._id) {
          
          FriendsService.update({sheet_id: sheet_id, _id: friend._id, name: newname.trim()}).then(function(data) {
            $scope.sheet.friends[i].name = newname.trim();
            $scope.sheet.friends[i].editable = false;
          });

          break ;
        }
      }
    }

    $scope.deleteFriend = function(friend) {
      //wait api (update all expenses & remove friend) 

      FriendsService.delete(sheet_id, friend._id).then(function(data) {
        var friends = $scope.sheet.friends;
        for (var i in friends) {
          if (friends[i]._id == friend._id) {
            $scope.sheet.friends.splice(i, 1);
            break ;
          }
        }

        //forloop on expenses to remove expenses paid_by friend_id
        var expenses = $scope.sheet.expenses;
        for (var i in expenses) {
          if (expenses[i].paid_by == friend._id) {
            $scope.sheet.expenses.splice(i, 1);
          }
        }

        //and to remove friend_id from paid_for in expenses
        for (var i in expenses) {
          if (expenses[i].paid_by != friend._id) {
            var indexInPaidFor = expenses[i].paid_for.indexOf(friend._id);
            if (indexInPaidFor > -1) {
              $scope.sheet.expenses[i].paid_for.splice(indexInPaidFor, 1);
            }
          }
        }
      });
    }

    $scope.addExpense = function(expense, dt) {
      var newExpense = expense;
      newExpense.sheet_id = sheet_id;
      newExpense.date = dt;

      console.log(newExpense);

      ExpensesService.create(newExpense).then(function(data) {
        $scope.sheet.expenses.push(data);
        return $state.go('sheets.expenses', {id: $scope.sheet._id});
      });
    }

    $scope.deleteExpense = function(expense) {
      ExpensesService.delete(sheet_id, expense._id).then(function(data) {
        var expenses = $scope.sheet.expenses;
        for (var i in expenses) {
          if (expenses[i]._id == expense._id) {
            $scope.sheet.expenses.splice(i, 1);
            break ;
          }
        }
      });
    }
  }
]);



app.factory('BalanceService', function() {
  return {
    compute: function(sheet) {
      var friends = sheet.friends;
      var expenses = sheet.expenses;
      var balance = [];

      //Create initial array containing for each friend, the list of other friends with amount = 0
      for (var i in friends) {
        balance[i] = {_id: friends[i]._id, name: friends[i].name, owes: []};
        for (var j in friends) {
          if (i != j) {
            balance[i].owes.push({_id: friends[j]._id, name: friends[j].name, amount: 0});
          }
        }
      }

      //Compute the amount owes by each friend to each others.
      for (var i in expenses) {
        var expense = expenses[i];
        var amountPerFriend = expense.amount / expense.paid_for.length;


        for (var j in balance) {

          if (balance[j]._id == expense.paid_by) {
            for (var k in expense.paid_for) {
              for (var l in balance[j].owes) {
                if (balance[j].owes[l]._id == expense.paid_for[k]) {
                  balance[j].owes[l].amount -= amountPerFriend;
                }
              }
            }
          }
          else {
            for (var k in expense.paid_for) {
              if (balance[j]._id == expense.paid_for[k]) {
                for (var l in balance[j].owes) {
                  if (balance[j].owes[l]._id == expense.paid_by) {
                    balance[j].owes[l].amount += amountPerFriend;
                    break ;
                  }
                }
              }
            }
          }
        }
      }

      //Remove negative amount
      for (var i in balance) {
        for (var j in balance[i].owes) {
          if (balance[i].owes[j].amount < 0) {
            balance[i].owes[j].amount = 0;
          }
        }
      }

      return balance;
    }

  };
});
app.factory('ExpensesService', function($http, $q, Options) {
  return {
    create: function(expense) {
      var deferred = $q.defer();

      $http.post(Options.baseUrl + '/expenses', expense).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    readAllFromSheet: function(sheet_id) {
      var deferred = $q.defer();

      $http.get(Options.baseUrl + '/expenses/' + sheet_id).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    read: function(sheet_id, id) {
      var deferred = $q.defer();

      $http.get(Options.baseUrl + '/expenses/' + sheet_id + '/' + id).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    update: function(expense) {
      var deferred = $q.defer();

      $http.put(Options.baseUrl + '/expenses', expense).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    delete: function(sheet_id, id) {
      var deferred = $q.defer();

      $http.delete(Options.baseUrl + '/expenses/' + sheet_id + '/' + id).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    }
  }
});
app.factory('FriendsService', function($http, $q, Options) {
  return {
    create: function(friend) {
      var deferred = $q.defer();

      $http.post(Options.baseUrl + '/friends', friend).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    readAllFromSheet: function(sheet_id) {
      var deferred = $q.defer();

      $http.get(Options.baseUrl + '/friends/' + sheet_id).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    read: function(sheet_id, id) {
      var deferred = $q.defer();

      $http.get(Options.baseUrl + '/friends/' + sheet_id + '/' + id).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    update: function(friend) {
      var deferred = $q.defer();

      $http.put(Options.baseUrl + '/friends', friend).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    delete: function(sheet_id, id) {
      var deferred = $q.defer();

      $http.delete(Options.baseUrl + '/friends/' + sheet_id + '/' + id).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    }
  }
});
app.factory('SheetsService', function($http, $q, Options) {
  return {
    create: function() {
      var deferred = $q.defer();

      $http.post(Options.baseUrl + '/sheets', {}).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    read: function(id) {
      var deferred = $q.defer();

      $http.get(Options.baseUrl + '/sheets/' + id).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    update: function(sheet) {
      var deferred = $q.defer();

      $http.put(Options.baseUrl + '/sheets', sheet).success(function(data) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    }
  }
});

app.config(function($mdThemingProvider) {
  var customBlueMap =$mdThemingProvider.extendPalette('light-blue', {
      'contrastDefaultColor': 'light',
      'contrastDarkColors': ['50'],
      '50': 'ffffff'
    });
    $mdThemingProvider.definePalette('customBlue', customBlueMap);
    $mdThemingProvider.theme('default')
      .primaryPalette('customBlue', {
        'default': '500',
        'hue-1': '50'
    })
    .accentPalette('pink');
    $mdThemingProvider.theme('input', 'default')
        .primaryPalette('grey')
});
	
	