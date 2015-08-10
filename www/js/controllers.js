angular.module('farmApp.controllers', ['farmApp.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modalLogin) {
    $scope.modalLogin = modalLogin;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modalLogin.hide();
  };

  // Open the login modal
  $scope.showLogin = function() {
    $scope.modalLogin.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };

})

.controller('DefaultController', ["$scope", "User", function($scope,User) {
  $scope.user = User.getUser();
  

}])

.controller('LoginController', ["$scope", "$ionicPopup","$ionicModal", "User", 
  function($scope,$ionicPopup,$ionicModal,User) {
  $scope.loginData = {
    username: '',
    password: '',
  };
  $scope.password = "";
  $scope.user = User.getUser();
  $scope.doLogin = function(){
    User.login($scope.loginData.username, $scope.loginData.password, function(res) {
      if (res.first_name) {
        $scope.user = res;
      } else {
        $ionicPopup.alert({
          title: 'Login error!',
          template: res.message
        });        
      }
    });
  };
  $scope.getNameComplete = function(){
    return User.getNameComplete();
  }

  // Creamos un modal para recuperar la contraseña de un usuario
  $ionicModal.fromTemplateUrl('templates/recuperarModal.html', {
    scope: $scope
  }).then(function(modalRecuperar) {
    $scope.modalRecuperar = modalRecuperar;
  });

  $scope.recuperarData = {};

  // Accion para cerrar el formRecuperar
  $scope.closeFormRecuperar = function() {
    $scope.modalRecuperar.hide();
  };

  // Accion para mostrar el formRecuperar
  $scope.showFormRecuperar = function() {
    $scope.modalRecuperar.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doRecuperar = function() {
    console.log('Doing recuperar', $scope.recuperarData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeFormRecuperar();
    }, 1000);
  };

}])

.controller('RegistroController', function($scope,User) {
  
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {

});
