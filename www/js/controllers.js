angular.module('farmApp.controllers', ['farmApp.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

})

.controller('DefaultController', ["$scope", "User","$state", function($scope,User,$state) {
  $scope.user = User.user;
  
  if($scope.user.first_name){
    $state.go('app.categorias');
  }

}])

.controller('LoginController', ["$scope", "$ionicPopup","$ionicModal", "User", "$state", 
  function($scope,$ionicPopup,$ionicModal,User,$state) {
  $scope.loginData = {
    username: '',
    password: '',
  };
  $scope.password = "";
  $scope.user = User.user;
  $scope.doLogin = function(){
    User.login($scope.loginData.username, $scope.loginData.password, function(res) {
      if (res.first_name) {
        $scope.user = res;
        $state.go('app.categorias');
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

  $scope.backInicio = function(){
    $state.go('inicio');
  };

}])

.controller('RegistroController', ["$scope", "$ionicPopup","$ionicModal", "User", "$state", 
  function($scope,$ionicPopup,$ionicModal,User,$state) {
  
  // Crear una ventana de terminos y condiciones
  $ionicModal.fromTemplateUrl('templates/terminosYCondiciones.html', {
    scope: $scope
  }).then(function(modalTerminos) {
    $scope.modalTerminos = modalTerminos;
  });  

  $scope.closeModalTerminos = function() {
    $scope.modalTerminos.hide();
  };

  // Accion para mostrar modalTerminos
  $scope.showModalTerminos = function() {
    $scope.modalTerminos.show();
  };

  $scope.backInicio = function(){
    $state.go('inicio');
  };

}])

.controller('CategoriasCtrl',["$scope","Categorias", function($scope,Categorias) {
  $scope.categorias = Categorias.query();
}])

.controller('ProductosCtrl', function($scope, $stateParams) {

});
