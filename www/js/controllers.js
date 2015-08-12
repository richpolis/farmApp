angular.module('farmApp.controllers', ['farmApp.services'])

.controller('AppCtrl', function($scope, User, $state) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  if(!User.hasUser()){
    $state.go('inicio');
  }else{
    $scope.user = User.getUser();
  }

  $scope.closeLogin = function(){
    User.logout();
    $state.go('inicio');
  };

  console.log($scope.user);

})

.controller('DefaultController', ["$scope", "User","$state", function($scope,User,$state) {
  $scope.user = User.getUser();
  
  if(User.hasUser()){
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
  $scope.user = User.getUser();
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
  
  $scope.userData = {};

  $scope.doRegister = function(){
    var todoCorrecto = true;
    var formulario = document.forms[0];
    for (var i=0; i<formulario.length; i++) {
        if(formulario[i].type =='text' || formulario[i].type=='tel' || formulario[i].type=='email' || formulario[i].type=='password') {
          if (formulario[i].value == null || formulario[i].value.length == 0 || /^\s*$/.test(formulario[i].value)){
              $ionicPopup.alert({
                title: 'Error de llenado!',
                template: formulario[i].name+ ' no puede estar vacío o contener sólo espacios en blanco'
              });
              todoCorrecto=false;
              break;
          }
        }
    }

    if (!todoCorrecto) return false;

    if($scope.userData.password != $scope.userData.repetir){
        $ionicPopup.alert({
          title: 'Las contraseñas no coinciden!',
          template: 'Favor de ingresar de repetir el mismo password'
        });
        todoCorrecto=false;
    }

    if (!todoCorrecto) return false;

    User.register($scope.userData, function(user){
      $scope.user = user;
      $state.go('app.categorias');
    });

  };


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

.controller('ProductosCtrl', function($scope, $stateParams, Categorias, Productos) {
  $scope.categorias =  Categorias.query(function(){
    for(var cont = 0; cont<=$scope.categorias.length; cont++){
      if($stateParams.categoriaId == $scope.categorias[cont].id){
        $scope.categoria = $scope.categorias[cont];
        break;
      }
    }
  });
  $scope.productos = Productos.query();
  
});
