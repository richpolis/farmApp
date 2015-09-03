angular.module('farmApp.controllers', ['farmApp.services','ngCordova'])

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

        .controller('PerfilController', function ($scope, $ionicPopup, $ionicModal,$cordovaGeolocation, $compile, $ionicLoading, User) {

            $scope.userData = User.getUser();
            $scope.direccionSeleccionada = "";
            $scope.direccionGuardada = User.getDireccionVacia();
			$scope.mostrarMapa = false;

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
                    $scope.userData = user;
                    $ionicPopup.alert({
                        title: 'Actualizacion!',
                        template: 'Actualizacion realizada'
                    });
                });

            };
            
            $scope.recuperarDireccion = function(){
              var select = document.getElementById('recuperar-direccion');
              if(select.value != ""){
                    for(var cont=0;cont<=$scope.userData.direcciones.length;cont++){
                        if($scope.userData.direcciones[cont].calle == select.value){
                            $scope.direccionGuardada = $scope.userData.direcciones[cont];
                            break;
                        }
                    }
                }else{
                    $scope.direccionGuardada = User.getDireccionVacia();
                }
            };
            
            $scope.doDireccion = function () {
                var select = document.getElementById('recuperar-direccion');
                if(select.value != ""){
                    for (var cont = 0; cont <= $scope.userData.direcciones.length; cont++) {
                        if ($scope.userData.direcciones[cont].calle == select.value) {
                            $scope.userData.direcciones[cont] = $scope.direccionGuardada;
                            User.save($scope.userData);
                            break;
                        }
                    }
                }else{
                    User.addDireccion($scope.direccionGuardada);
                    $scope.userData = User.getUser();
                    $scope.direccionGuardada = User.getDireccionVacia();
                }
            };
            
            // Crear una ventana de terminos y condiciones
            $ionicModal.fromTemplateUrl('templates/mapaModal.html', {
                scope: $scope
            }).then(function (mapa) {
                $scope.mapa = mapa;
            });

            $scope.closeMapa = function () {
                $scope.mapa.hide();
            };

            // Accion para mostrar modalTerminos
            $scope.showMapa = function () {
                var posOptions = {timeout: 10000, enableHighAccuracy: false};
                $cordovaGeolocation
                    .getCurrentPosition(posOptions)
                    .then(function (position) {
						console.log(position);
                      $scope.lat  = position.coords.latitude
                      $scope.long = position.coords.longitude
                      /*$scope.mapa.show();*/
						debugger;
					  $scope.mostrarMapa = true;
                      $scope.ubicacionDelMapa();
                    }, function(err) {
                      $ionicPopup.alert({
                            title: 'Error de localizacion!',
                            template: 'No esta activa la localizacion'
                        });
                    });
            };
            
            $scope.ubicacionDelMapa = function(){
				var myLatlng = new google.maps.LatLng($scope.lat,$scope.long);
        
				var mapOptions = {
				  center: myLatlng,
				  zoom: 16,
				  mapTypeId: google.maps.MapTypeId.ROADMAP
				};
				$scope.map = new google.maps.Map(document.getElementById("mapa"),mapOptions);
				
				var marker = new google.maps.Marker({
				  position: myLatlng,
				  map: $scope.map,
				  title: 'Mi ubicación actual (' + User.getNameComplete() +')'
				});
				
				$scope.buscarDireccion = function () {
					var geocoder = new google.maps.Geocoder();
					var mapa = document.getElementById("mapa");
					var direccionBuscar = document.getElementById("direccionBuscar");
					console.log(direccionBuscar.value);
					geocoder.geocode({ 'address': direccionBuscar.value}, function(results, status) {
						// Verificamos el estatus
						if (status == 'OK') {
							// Si hay resultados encontrados, centramos y repintamos el mapa
							// esto para eliminar cualquier pin antes puesto
							var mapOptions = {
								center: results[0].geometry.location,
								mapTypeId: google.maps.MapTypeId.ROADMAP
							};
							$scope.map = new google.maps.Map(mapa, mapOptions);
							// fitBounds acercará el mapa con el zoom adecuado de acuerdo a lo buscado
							$scope.map.fitBounds(results[0].geometry.viewport);
							// Dibujamos un marcador con la ubicación del primer resultado obtenido
							var markerOptions = { 
								position: results[0].geometry.location,
								draggable: true,
								dragend: function(e) {
									$scope.lat = e.latLng.A;
									$scope.long = e.latLng.F;
							  }};
							var marker = new google.maps.Marker(markerOptions);
							marker.setMap($scope.map);
						} else {
							// En caso de no haber resultados o que haya ocurrido un error
							// lanzamos un mensaje con el error
							alert("Geocoding no tuvo éxito debido a: " + status);
						}
					});
					/*GMaps.geocode({
						address: $scope.direccionBuscar,
						callback: function (results, status) {
							if (status == 'OK') {
								var latlng = results[0].geometry.location;
								$scope.map.setCenter(latlng.lat(), latlng.lng());
								$scope.lat = latlng.lat();
								$scope.long = latlng.lng();
								$scope.map.addMarker({
									lat: latlng.lat(),
									lng: latlng.lng(),
									draggable: true,
									dragend: function(e) {
										$scope.lat = e.latLng.A;
										$scope.long = e.latLng.F;
								  }
								});
							}
						}
					});*/
				};
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
                        $scope.producto.periodico = {};
                        $scope.producto.periodico.pedido = false;
                        $scope.producto.periodico.periodo = "Semanal";
                        $scope.producto.periodico.visitas = 1;
                        $scope.producto.periodico.diaLunes = true;
                        $scope.producto.periodico.diaMartes = false;
                        $scope.producto.periodico.diaMiercoles = false;
                        $scope.producto.periodico.diaJueves = false;
                        $scope.producto.periodico.diaViernes = false;
                        $scope.producto.periodico.diaSabado = false;
                        $scope.producto.periodico.diaDomingo = false;
                        $scope.producto.periodico.periocidad = "";
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

        .controller('CarritoController', function ($scope, $ionicPopup, $ionicModal, $timeout, Carrito, PedidosPeriodicos) {
            
            $scope.productos = Carrito.getProductos();
            $scope.total = Carrito.getTotal();
            $scope.productoSeleccionado = {};
            
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
            
            
            // Crear un formulario modal de pedido periodico
            $ionicModal.fromTemplateUrl('templates/agregarPedidoPeriodico.html', {
                scope: $scope
            }).then(function (modalAgregarPedidoPeridico) {
                $scope.modalAgregarPedidoPeridico = modalAgregarPedidoPeridico;
            });

            $scope.closeAgregarPedidoPeriodico = function () {
                $scope.modalAgregarPedidoPeridico.hide();
            };

            // Accion para mostrar form modal pedido periodico
            $scope.showAgregarPedidoPeriodico = function (producto) {
                if(producto.periodico.pedido){
                    $scope.productoSeleccionado = producto;
                    $scope.modalAgregarPedidoPeridico.show();
                }
            };
            
            $scope.agregarPedidoPeriodico = function(){
                PedidosPeriodicos.addProducto($scope.productoSeleccionado);
                $scope.productoSeleccionado = {};
                $scope.closeAgregarPedidoPeriodico();
            };
            
        })
        .controller('PedidoController', function ($scope, $state, User) {
            $scope.direccionGuardada = User.getDireccionVacia();
            $scope.userData = User.getUser();
            $scope.direccionGuardada = "";
            
            $scope.doPedido = function () {
                $state.go('app.pago');
            };
            
            $scope.recuperarDireccion = function(){
              var select = document.getElementById('recuperar-direccion-pedido');
              if(select.value != ""){
                    for(var cont=0;cont<=$scope.userData.direcciones.length;cont++){
                        if($scope.userData.direcciones[cont].calle == select.value){
                            $scope.direccionGuardada = $scope.userData.direcciones[cont];
                            break;
                        }
                    }
                }else{
                    $scope.direccionGuardada = User.getDireccionVacia();
                }
            };
            
            $scope.doDireccion = function () {
                var select = document.getElementById('recuperar-direccion-pedido');
                if(select.value != ""){
                    for (var cont = 0; cont <= $scope.userData.direcciones.length; cont++) {
                        if ($scope.userData.direcciones[cont].calle == select.value) {
                            $scope.userData.direcciones[cont] = $scope.direccionGuardada;
                            User.save($scope.userData);
                            break;
                        }
                    }
                }else{
                    User.addDireccion($scope.direccionGuardada);
                    $scope.userData = User.getUser();
                    $scope.direccionGuardada = User.getDireccionVacia();
                }
            };

        })

        .controller('PagoController', function ($scope, User, $ionicPopup, $state, $ionicModal) {
            $scope.pago = {
                tarjeta: '',
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

        .controller('PedidosPeriodicosController', function ($scope, $timeout, $ionicPopup, PedidosPeriodicos) {
            $scope.productos = PedidosPeriodicos.getProductos();
            
            $timeout(function(){
               $scope.$apply(); 
            });
            
            $scope.removeProducto = function (producto) {
                $ionicPopup.alert({
                    title: 'Quitando!',
                    template: 'Se quito de listado de productos periodicos'
                });
                $scope.productos = PedidosPeriodicos.removeProducto(producto);
            };
            
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
