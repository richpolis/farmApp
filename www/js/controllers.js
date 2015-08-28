angular.module('farmApp.controllers', ['farmApp.services'])

        .controller('AppController', function ($scope, User, $state) {

            // With the new view caching in Ionic, Controllers are only called
            // when they are recreated or on app start, instead of every page change.
            // To listen for when this page is active (for example, to refresh data),
            // listen for the $ionicView.enter event:
            //$scope.$on('$ionicView.enter', function(e) {
            //});
            if (!User.hasUser()) {
                $state.go('inicio');
            } else {
                $scope.user = User.getUser();
            }

            $scope.closeLogin = function () {
                User.logout();
                $state.go('inicio');
            };

            console.log($scope.user);

            $scope.goCategorias = function () {
                $state.go('app.categorias');
            };

        })

        .controller('DefaultController', function ($scope, User, $state) {
            $scope.user = User.getUser();

            if (User.hasUser()) {
                $state.go('app.categorias');
            }

        })

        .controller('LoginController', function ($scope, $ionicPopup, $ionicModal, User, $state) {
            $scope.loginData = {
                username: '',
                password: '',
            };
            $scope.password = "";
            $scope.user = User.getUser();
            $scope.doLogin = function () {
                User.login($scope.loginData.username, $scope.loginData.password, function (res) {
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
            $scope.getNameComplete = function () {
                return User.getNameComplete();
            }

            // Creamos un modal para recuperar la contraseña de un usuario
            $ionicModal.fromTemplateUrl('templates/recuperarModal.html', {
                scope: $scope
            }).then(function (modalRecuperar) {
                $scope.modalRecuperar = modalRecuperar;
            });

            $scope.recuperarData = {};

            // Accion para cerrar el formRecuperar
            $scope.closeFormRecuperar = function () {
                $scope.modalRecuperar.hide();
            };

            // Accion para mostrar el formRecuperar
            $scope.showFormRecuperar = function () {
                $scope.modalRecuperar.show();
            };

            // Perform the login action when the user submits the login form
            $scope.doRecuperar = function () {
                console.log('Doing recuperar', $scope.recuperarData);

                // Simulate a login delay. Remove this and replace with your login
                // code if using a login system
                $timeout(function () {
                    $scope.closeFormRecuperar();
                }, 1000);
            };

            $scope.backInicio = function () {
                $state.go('inicio');
            };

        })

        .controller('RegistroController', function ($scope, $ionicPopup, $ionicModal, User, $state) {

            $scope.userData = {};

            $scope.doRegister = function () {
                var todoCorrecto = true;
                var formulario = document.forms[0];
                for (var i = 0; i < formulario.length; i++) {
                    if (formulario[i].type == 'text' || formulario[i].type == 'tel' || formulario[i].type == 'email' || formulario[i].type == 'password') {
                        if (formulario[i].value == null || formulario[i].value.length == 0 || /^\s*$/.test(formulario[i].value)) {
                            $ionicPopup.alert({
                                title: 'Error de llenado!',
                                template: formulario[i].name + ' no puede estar vacío o contener sólo espacios en blanco'
                            });
                            todoCorrecto = false;
                            break;
                        }
                    }
                }

                if (!todoCorrecto)
                    return false;

                if ($scope.userData.password != $scope.userData.repetir) {
                    $ionicPopup.alert({
                        title: 'Las contraseñas no coinciden!',
                        template: 'Favor de ingresar de repetir el mismo password'
                    });
                    todoCorrecto = false;
                }

                if (!todoCorrecto)
                    return false;

                User.register($scope.userData, function (user) {
                    $scope.user = user;
                    $state.go('app.categorias');
                });

            };


            // Crear una ventana de terminos y condiciones
            $ionicModal.fromTemplateUrl('templates/terminosYCondiciones.html', {
                scope: $scope
            }).then(function (modalTerminos) {
                $scope.modalTerminos = modalTerminos;
            });

            $scope.closeModalTerminos = function () {
                $scope.modalTerminos.hide();
            };

            // Accion para mostrar modalTerminos
            $scope.showModalTerminos = function () {
                $scope.modalTerminos.show();
            };

            $scope.backInicio = function () {
                $state.go('inicio');
            };

        })

        .controller('PerfilController', function ($scope, $ionicPopup, User) {

            $scope.userData = User.getUser();

            $scope.doRegister = function () {
                var todoCorrecto = true;
                var formulario = document.forms[0];
                for (var i = 0; i < formulario.length; i++) {
                    if (formulario[i].type == 'text' || formulario[i].type == 'tel' || formulario[i].type == 'email' || formulario[i].type == 'password') {
                        if (formulario[i].value == null || formulario[i].value.length == 0 || /^\s*$/.test(formulario[i].value)) {
                            $ionicPopup.alert({
                                title: 'Error de llenado!',
                                template: formulario[i].name + ' no puede estar vacío o contener sólo espacios en blanco'
                            });
                            todoCorrecto = false;
                            break;
                        }
                    }
                }

                if (!todoCorrecto)
                    return false;

                if ($scope.userData.password != $scope.userData.repetir) {
                    $ionicPopup.alert({
                        title: 'Las contraseñas no coinciden!',
                        template: 'Favor de ingresar de repetir el mismo password'
                    });
                    todoCorrecto = false;
                }

                if (!todoCorrecto)
                    return false;

                User.register($scope.userData, function (user) {
                    $scope.user = user;
                    $ionicPopup.alert({
                        title: 'Actualizacion!',
                        template: 'Actualizacion realizada'
                    });
                });

            };

        })

        .controller('CategoriasController', function ($scope, Categorias) {
            $scope.categorias = Categorias.query();
        })

        .controller('ProductosController', function ($scope, $stateParams, $timeout, $state, Categorias, Productos) {
            $scope.title = "Productos";

            $scope.categorias = Categorias.query(function () {
                for (var cont = 0; cont <= $scope.categorias.length; cont++) {
                    if ($stateParams.categoriaId == $scope.categorias[cont].id) {
                        $scope.categoria = $scope.categorias[cont];
                        $scope.title = $scope.categoria.name;
                        $timeout(function(){
                            $scope.$apply();
                        });
                        break;
                    }
                }
            });

            $scope.productos = Productos.query(function () {
                // hacer algo despues de la carga
            });

            $scope.verProducto = function (producto) {
                console.log(producto.id);
                $state.go('app.detalle', {productoId: producto.id});
            }

        })

        .controller('ProductoController', function ($scope, $stateParams, $timeout, $state, Productos, Carrito) {
            $scope.total = 0;
            $scope.title = "Detalle producto";
            var productos = Productos.query(function () {
                for (var cont = 0; cont <= productos.length; cont++) {
                    if (productos[cont].id == $stateParams.productoId) {
                        $scope.producto = productos[cont];
                        $scope.producto.cantidad = 1;
                        $scope.producto.pedido_periodico = false;
                        $scope.title = $scope.producto.name;
                        $timeout(function(){
                            $scope.$apply();
                        });
                        break;
                    }
                }
            });

            $scope.mostrarTotal = function () {
                $scope.total = 0;
                $scope.total += $scope.producto.precio * $scope.producto.cantidad;
            };
            
            $scope.addCarrito = function(producto){
               if(Carrito.addProducto(producto)){
                   $state.go('app.carrito');
               }
            };

        })

        .controller('CarritoController', function ($scope, $ionicPopup, $timeout, Carrito) {
            
            $scope.productos = Carrito.getProductos();
            $scope.total = Carrito.getTotal();
            
            $timeout(function(){
               $scope.$apply(); 
            });
            
            $scope.mostrarTotal = function () {
                $scope.total = Carrito.getTotal();
            };

            $scope.removeProducto = function (producto) {
                $ionicPopup.alert({
                    title: 'Quitando!',
                    template: 'Se quito del carrito'
                });
                $scope.productos = Carrito.removeProducto(producto);
                $scope.mostrarTotal();
            };
        })
        .controller('PedidoController', function ($scope, $state) {
            $scope.direccion = {
                estado: 'México DF',
                calle: '',
                num_exterior: '',
                num_interior: '',
                cp: '',
                delegacion_municipio: '',
                colonia: ''
            };

            $scope.doPedido = function () {
                $state.go('app.pago');
            };

        })

        .controller('PagoController', function ($scope, User, $ionicPopup, $state, $ionicModal) {
            $scope.pago = {
                tarjeta: '',
                pais: '',
                cvv: '',
                mes: '',
                ano: ''
            };

            $scope.user = User.getUser();

            $scope.doPago = function () {
                $scope.showPedidoRealizado();
            };

            // Creamos el modal para finalizar el pago
            $ionicModal.fromTemplateUrl('templates/pedidoRealizadoModal.html', {
                scope: $scope
            }).then(function (pedidoRealizado) {
                $scope.pedidoRealizado = pedidoRealizado;
            });

            // Accion para cerrar el formRecuperar
            $scope.closePedidoRealizado = function () {
                $scope.pedidoRealizado.hide();
                $state.go('app.categorias');
            };

            // Accion para mostrar el formRecuperar
            $scope.showPedidoRealizado = function () {
                $scope.pedidoRealizado.show();
            };

        })

        .controller('PedidosPeriodicosController', function ($scope, Productos) {
            $scope.productos = Productos.query(function () {
                for (var cont = 0; cont <= $scope.productos.length; cont++) {
                    $scope.productos[cont].cantidad = 1;
                }
            });
        })

        .controller('ContactoController', function ($scope, $state, $ionicPopup) {
            $scope.contactoData = {
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            };

            $scope.doContacto = function () {
                $ionicPopup.alert({
                    title: 'Enviando...',
                    template: 'Gracias por enviar tus comentarios'
                });
            };

        })

        .controller('PreguntasController', function ($scope, Preguntas) {
            $scope.preguntas = Preguntas.query();
        })

        .controller('SearchController', function ($scope, Productos) {
            $scope.productos = Productos.query(function () {
                // hacer algo despues de la carga
            });
        })
        ;
