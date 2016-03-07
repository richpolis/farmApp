angular.module('farmApp.controllers', ['ionic','ionic.service.core',  'ionic.service.push',
                                        'farmApp.services', 'ngCordova'])
        .controller('AppController', function ($scope, $state, $timeout, $ionicPopup,
                                User, Carrito, PedidosPeriodicos, $ionicPush,
                                $rootScope, Carrito, FileService) {

            $scope.ionic_push = false;

            if (!User.hasToken()) {
                $state.go('inicio');
            } else {
                $scope.user = User.getUser();
            }
            $scope.closeLogin = function () {
                User.logout().then(function (data) {
                    limpiar_cache();
                    $state.go('inicio');
                }, function (err) {
                    alert(err.detail);
                });
            };
            $scope.goCategorias = function () {
                $state.go('app.categorias');
            };

            $scope.productos = Carrito.getCountProductos();
            $scope.$on("carrito", function (event, data) {
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.productos = Carrito.getCountProductos();
                    });
                }, 1000);
            });

            $scope.periodicos = PedidosPeriodicos.getCountPedidos();
            $scope.$on("periodicos", function (event, data) {
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.periodicos = PedidosPeriodicos.getCountPedidos();
                    });
                }, 1000);
            });

            $scope.$on("venta", function (event, data) {
                $rootScope.$broadcast("venta_emtpy", "limpiar");
            });

            $scope.$on("empty", function (event, data) {
                limpiar_cache();
            });

            var limpiar_cache = function () {
                console.log("entrando a limpiar cache");
                Carrito.empty();
                FileService.empty();
                window.localStorage.removeItem('user');
                window.localStorage.removeItem('access_token');
            };

            var ionicPush = function(){
                $ionicPush.init({
                    "onNotification": function (notification) {
                        var payload = notification._payload;
                        console.log(notification);
                        //alert(JSON.stringify(notification));
                        $ionicPopup.alert({
                            title: notification.title,
                            template: notification.text
                        });
                        if(payload.reminderId){
                            $state.go('app.viewRecordatorio',{'notificacionId': payload.reminderId});
                        }
                        if(payload.saleId){
                            $state.go('app.viewPedido',{'pedidoId': payload.saleId});
                        }
                    },
                    "onRegister": function (data) {
                        console.log("Login Token Phone: " + data.token);
                        //alert("Login Token Phone: " + data.token);
                        if(!User.hasTokenPhone()){
                            User.addTokenPhone(data.token);
                        }else{
                            User.updateTokenPhone(data.token);
                        }
                    },
                    "onError": function(e){
                      console.log(e);
                    },
                    "pluginConfig": {
                      "ios": {
                        "badge": true,
                        "sound": true
                       },
                       "android": {
                         "sound": true,
                         "vibrate": true
                       }
                    }
                });
                $ionicPush.register();
            };

            $scope.$on("ionic_push", function (event, data) {
                if(!$scope.ionic_push){
                    $timeout(function () {
                        $scope.$apply(function () {
                            $scope.$broadcast('venta_emtpy',data);
                        });
                    }, 500);
                    ionicPush();
                    $scope.ionic_push = true;
                }else{
                    ionicPush();
                }
            });

            $scope.$on("recordatorios",function(event, data){
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.$broadcast('recordatorios_actualizar',data);
                    });
                }, 500);
            });


        })
        .controller('DefaultController', function ($scope, $state, User) {
            $scope.user = User.getUser();
            if (User.hasUser()) {
                $state.go('app.categorias');
            }


        })
        .controller('LoginController', function ($scope, $ionicPopup,
                    $ionicModal, $state, User, Loader, RecuperarPassword) {
            $scope.data = {
                email: '',
                password: ''
            };
            $scope.password = "";
            $scope.user = User.getUser();

            function login() {
                Loader.showLoading("Cargando información...");
                User.login($scope.data.email, $scope.data.password)
                        .then(function (token) {
                            get_me();
                        }, function (err) {
                            Loader.hideLoading();
                            //alert("error en login " + JSON.stringify(err));
                            $ionicPopup.alert({
                                title: 'Login error!',
                                template: "Email o password incorrectos"
                            });
                        });
            }
            function get_me() {
                User.me().then(function (user) {
                    Loader.hideLoading();
                    $scope.$emit('ionic_push', 'inicializar');
                    $scope.user = user;
                    $state.go('app.categorias');
                }, function (err) {
                    //alert("error en user_me " + JSON.stringify(err));
                    Loader.hideLoading();
                    // error case
                    $ionicPopup.alert({
                        title: 'Error en recuperar datos!',
                        template: err.detail
                    });
                });
            }
            $scope.doLogin = function () {
                login();
            };
            $scope.getNameComplete = function () {
                return User.getNameComplete();
            };

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
                Loader.showLoading("Enviando solicitud...");
                RecuperarPassword.recuperarPassword($scope.recuperarData).then(function(data){
                    $ionicPopup.alert({
                        title: 'Recuperar contraseña!',
                        template: 'Se ha enviado a su correo una solicitud de restablecer contraseña'
                    });
                    $scope.closeFormRecuperar();
                    Loader.hideLoading();
                },function(err){
                    $ionicPopup.alert({
                        title: 'Recuperar contraseña!',
                        template: err.detail
                    });
                    Loader.hideLoading();
                });

            };

            $scope.backInicio = function () {
                $state.go('inicio');
            };
        })

        .controller('RegistroController', function ($scope, $ionicPopup,
                $ionicModal, $state, User, Loader) {
            $scope.data = {};
            $scope.doRegister = function () {
                var todoCorrecto = true;
                var formulario = document.forms[0];
                var expr = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
                for (var i = 0; i < formulario.length; i++) {
                    if (formulario[i].type == 'text' || formulario[i].type == 'tel' || formulario[i].type == 'email' || formulario[i].type == 'password') {
                        if (formulario[i].value === null || formulario[i].value.length == 0 || /^\s*$/.test(formulario[i].value)) {
                            $ionicPopup.alert({
                                title: 'Error de llenado!',
                                template: formulario[i].name + ' no puede estar vacío o contener sólo espacios en blanco'
                            });
                            todoCorrecto = false;
                            break;
                        }
                    }
                    if (formulario[i].type=='email'){
                        if (!expr.test(formulario[i].value)){
                            $ionicPopup.alert({
                                title: 'Error de llenado!',
                                template: 'El email no es valido'
                            });
                            todoCorrecto = false;
                            break;
                        }
                    }
                }

                if (!todoCorrecto)
                    return false;

                if ($scope.data.password != $scope.data.repetir) {
                    $ionicPopup.alert({
                        title: 'Las contraseñas no coinciden!',
                        template: 'Favor de ingresar de repetir el mismo password'
                    });
                    todoCorrecto = false;
                }
                if (!todoCorrecto)
                    return false;
                Loader.showLoading("Cargando información...");
                User.register($scope.data).then(function (user) {
                    var usuario = user;
                    $ionicPopup.alert({
                        title: 'Registro!',
                        template: 'Registro realizado'
                    });
                    User.login(usuario.email, usuario.password).then(function (token) {
                        Loader.hideLoading();
                        $scope.$emit('ionic_push', 'inicializar');
                        $state.go('app.categorias');
                    }, function (err) {
                        Loader.hideLoading();
                        $state.go('login');
                    });
                }, function (err) {
                    Loader.hideLoading();
                    console.log(err);
                    $ionicPopup.alert({
                        title: 'Register error!',
                        template: err.detail
                    });
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

        .controller('PerfilController', function ($scope, $ionicPopup,
                    $cordovaGeolocation, $timeout, $ionicModal, User,
                    Direcciones, Pedidos, Loader, FileService, ImageService) {

            $scope.userData = User.getUser();
            $scope.direccionBuscar = "";
            $scope.direccionSeleccionada = {
              id: 0
            };
            $scope.direccionGuardada = Direcciones.getDireccionVacia();
            $scope.marker = null;
            $scope.platform = ionic.Platform.platform();
            $scope.marginTop = ($scope.platform == "android" ? '100px' : '50px');
            $scope.direcciones = [];
            $scope.colonias = [];
            $scope.pedidos = [];
            $scope.mostrarMensajeMapa = true;
            $scope.inapam = FileService.inapams();
            Direcciones.getDirecciones().then(function (direcciones) {
                $scope.direcciones = direcciones;
                if($scope.direcciones.length==1){
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.direccionSeleccionada.id = $scope.direcciones[0].id;
                        })
                    },2000);
                }else{
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.direccionSeleccionada.id = 0;
                        })
                    },2000);
                }
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en recuperar direcciones!',
                    template: err
                });
            });
            Pedidos.getPedidos().then(function (pedidos) {
                $scope.pedidos = pedidos;
            });

            $scope.doRegister = function () {
                var todoCorrecto = true;
                var formulario = document.forms[0];
                for (var i = 0; i < formulario.length; i++) {
                    if (formulario[i].type == 'text' || formulario[i].type == 'tel' || formulario[i].type == 'email' || formulario[i].type == 'password') {
                        if (formulario[i].value == null || formulario[i].value.length == 0 || /^\s*$/.test(formulario[i].value)) {
                            //alert(formulario[i].name);
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

                User.update($scope.userData).then(function (user) {
                    User.me().then(function (usuario) {
                        $scope.userData = usuario;
                        $ionicPopup.alert({
                            title: 'Actualizacion!',
                            template: 'Actualizacion realizada'
                        });
                    }, function (err) {
                        $ionicPopup.alert({
                            title: 'Actualizacion!',
                            template: err.detail
                        });
                    });
                }, function (err) {
                    console.log(err);
                    $ionicPopup.alert({
                        title: 'Error en actualizacion!',
                        template: err
                    });
                });
            };

            $scope.urlForImage = function (image) {
                var url = FileService.getUrlForImage(image);
                return url;
            };

            $scope.removeImage = function (image) {
                FileService.removeImage(image,FileService.INAPAM_STORAGE_KEY).then(function(success){
                    $scope.inapam = FileService.inapams();
                    $scope.$apply();
                });
            };
            
            $scope.deleteInapam = function(image){
                User.borrarImagesInapam(image);
                User.me().then(function(user){
                    $scope.userData = user;
                    $scope.inapam = FileService.inapams();
                    $scope.$apply();
                });
            };

            $scope.$watch('userData.inapam', function () {
                if ($scope.userData.inapam && $scope.inapam.length==0) {
                    Loader.showLoading("Abriendo para cargar imagen");
                    $ionicModal.fromTemplateUrl('templates/inapamModal.html', {
                        scope: $scope,
                        animation: 'slide-in-up',
                        focusFirstInput: true
                    }).then(function (modal) {
                        Loader.hideLoading();
                        $scope.modalInapam = modal;
                        $scope.modalInapam.show();
                    });

                    $scope.hideInapamModal = function () {
                        if($scope.inapam.length>0){
                            $scope.removeImage($scope.inapam[0]);
                        }
                        $scope.modalInapam.hide();
                        $scope.modalInapam.remove();
                        $scope.userData.inapam = false;
                    };

                    $scope.addImage = function (type) {
                        ImageService.handleMediaDialog(type, FileService.INAPAM_STORAGE_KEY).then(function(success){
                            $scope.inapam = FileService.inapams();
                            $scope.$apply();
                        },function(err){
                            $ionicPopup.alert({
                                title: 'Error: Inapam',
                                template: 'No se pudo capturar la imagen.'
                            });
                        });
                    };

                    $scope.confirmarFotoInapam = function () {
                        var user = User.getUser();
                        var token = User.getAuthToken();
                        var params = { "active":false , "usuario": user.id },
                            headers = {
                                "Accept": "application/json",
                                "Authorization": "Token " + token
                            };
                        var image = $scope.inapam[0];
                        ImageService.uploadInapam(image, params, headers, function(result){
                          Loader.hideLoading();
                          $scope.hideInapamModal();
                          $ionicPopup.alert({
                              title: 'Inapam',
                              template: 'Gracias, por enviarnos su imagen, en breve sera revisada.'
                          });
                          User.me().then(function(user){
                              $scope.userData = user;
                              $scope.removeImage();
                              $scope.inapam = FileService.inapams();
                          });
                        }, function(err){
                          Loader.hideLoading();
                          $ionicPopup.alert({
                              title: 'Inapam',
                              template: "ERROR: " + JSON.stringify(err)
                          });
                          $scope.removeImage();
                        });
                    };

                }
            });

            var recuperarDireccion = function () {
                if ($scope.direccionSeleccionada.id > 0) {
                    for (var cont = 0; cont <= $scope.direcciones.length; cont++) {
                        if ($scope.direcciones[cont].id == $scope.direccionSeleccionada.id) {
                            $scope.direccionGuardada = $scope.direcciones[cont];
                            $scope.colonias = [];
                            break;
                        }
                    }
                } else {
                    $scope.direccionGuardada = Direcciones.getDireccionVacia();
                    $scope.mostrarMapa = false;
                }
            };

            $scope.$watch("direccionSeleccionada.id",recuperarDireccion);

            $scope.doDireccion = function () {
                if ($scope.direccionGuardada.id) {
                    $scope.direccionSeleccionada.id = $scope.direccionGuardada.street;
                    for (var cont = 0; cont <= $scope.direcciones.length; cont++) {
                        if ($scope.direcciones[cont].id == $scope.direccionSeleccionada.id) {
                            $scope.direcciones[cont] = $scope.direccionGuardada;
                            Direcciones.updateDireccion(cont, $scope.direccionGuardada).then(function (direccion) {
                                $scope.direcciones[cont] = direccion
                                $scope.direccionGuardada = direccion;
                                $scope.colonias = [];
                            }, function (err) {
                                $ionicPopup.alert({
                                    title: 'Error en actualizar direccion!',
                                    template: err.detail
                                });
                            });
                            break;
                        }
                    }
                } else {
                    confirmarUtilizarDireccionEnvio();
                    Direcciones.addDireccion($scope.direccionGuardada).then(function (direccion) {
                        $scope.direcciones.push(direccion);
                        $scope.direccionGuardada = Direcciones.getDireccionVacia();
                        $scope.colonias = [];
                    }, function (err) {
                        console.log(err);
                        $ionicPopup.alert({
                            title: 'Error en agregar direccion!',
                            template: err.detail
                        });
                    });
                }
            };

            $scope.$watch('direccionGuardada.postal_code', function () {
                if ($scope.direccionGuardada.postal_code.length == 5 && !$scope.direccionGuardada.id) {
                    Loader.showLoading("buscando codigo postal");
                    Direcciones.getDataPostalCode($scope.direccionGuardada.postal_code)
                            .then(function (data) {
                                $scope.direccionGuardada.location = data[0].estado;
                                $scope.direccionGuardada.delegation_municipaly = data[0].municipio;
                                $scope.direccionGuardada.colony = data[0].colonia;
                                if (data.length > 1) {
                                    $scope.colonias = [];
                                    for (var cont = 0; cont < data.length; cont++) {
                                        $scope.colonias.push(data[cont].colonia);
                                    }
                                }
                                Loader.hideLoading();
                            }, function (err) {
                                Loader.hideLoading();
                                $ionicPopup.alert({
                                    title: 'Error en recuperar datos de codigo postal!',
                                    template: err
                                });
                            });
                }
            });

            function hasDireccionbuscar() {
                return $scope.direccionBuscar.length>0;
            }

            function confirmarUtilizarDireccionEnvio () {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Confirmar utilizar direccion',
                    template: 'Deseas guardar la direccion para proximas entregas?',
                    cancelText: "No",
                    okText: "Si"
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        $scope.direccionGuardada.active = true;
                    } else {
                        $scope.direccionGuardada.active = false;
                    }
                });
            };

            $scope.confirmarSeleccionMapa = function () {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Confirmar direccion',
                    template: 'Es correcta la direccion ' + $scope.direccionBuscar + '?',
                    cancelText: "No",
                    okText: "Si"
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        //$scope.doDireccion();
                        $scope.hideModalMap();
                    } else {
                        $scope.direccionBuscar = "";
                        $scope.direccionBuscar.focus();
                    }
                });
            };

            $scope.centerOnMe = function () {
                if (!$scope.map)
                    return;
                $timeout(function(){
                    $scope.mostrarMensajeMapa = false;
                },4000);
                var posOptions = {timeout: 10000, enableHighAccuracy: true};
                $cordovaGeolocation
                        .getCurrentPosition(posOptions)
                        .then(function (position) {
                            Loader.hideLoading();
                            $scope.direccionGuardada.lat = position.coords.latitude;
                            $scope.direccionGuardada.lng = position.coords.longitude;
                            $scope.mostrarMapa = true;
                            $scope.ubicacionDelMapa(position);
                        }, function (err) {
                            $ionicPopup.alert({
                                title: 'Error de localizacion!',
                                template: 'No esta activa la localizacion'
                            });
                        });
            }

            $scope.mapCreated = function (map) {
                $scope.mostrarMensajeMapa = true;
                $scope.map = map;
                Loader.showLoading('cargando informacion...');
                if (!$scope.direccionGuardada.lat || $scope.direccionGuardada.lat == 0) {
                    $scope.centerOnMe();
                } else {
                    Loader.hideLoading();
                    $scope.ubicacionDelMapa();
                }
            };

            // Abrir el mapa en modal
            $scope.showModalMap = function () {
                Loader.showLoading("Abriendo el mapa");
                $ionicModal.fromTemplateUrl('templates/mapaModal.html', {
                    scope: $scope,
                    animation: 'slide-in-up',
                    focusFirstInput: true
                }).then(function (modal) {
                    Loader.hideLoading();
                    $scope.modal = modal;
                    $scope.modal.show();
                });
            };

            $scope.hideModalMap = function () {
                $scope.modal.hide();
                $scope.modal.remove();
            };

            $scope.setValuesResults = function (results) {
                var componentes = results[0].address_components;
                for (var cont = 0; cont < componentes.length; cont++) {
                    console.log(componentes[cont]);
                    if (componentes[cont].types.indexOf("postal_code") >= 0 ) {
                        $scope.direccionGuardada.postal_code = componentes[cont].long_name;
                        console.log($scope.direccionGuardada);
                    }else if(componentes[cont].types.indexOf("street_address") >= 0 ||
                        componentes[cont].types.indexOf("route") >= 0){
                        $scope.direccionGuardada.street = componentes[cont].long_name;
                    }else if(componentes[cont].types.indexOf("street_number") >= 0){
                        $scope.direccionGuardada.exterior_number= componentes[cont].short_name;
                    }else if(componentes[cont].types.indexOf("locality") >= 0){
                        $scope.direccionGuardada.location= componentes[cont].short_name;
                    }else if(componentes[cont].types.indexOf("sublocality") >= 0){
                        $scope.direccionGuardada.colony= componentes[cont].short_name;
                    }

                }
            };

            $scope.ubicacionDelMapa = function () {

                var myLatlng = new google.maps.LatLng($scope.direccionGuardada.lat, $scope.direccionGuardada.lng);

                if ($scope.marker) {
                    console.log("existe marker");
                    $scope.marker.setMap(null);
                }

                $scope.marker = new google.maps.Marker({
                    position: myLatlng,
                    map: $scope.map,
                    title: 'Mi ubicación',
                    draggable: true
                });

                var geocoder;
                var infowindow = new google.maps.InfoWindow({maxWidth:350});

                geocoder = new google.maps.Geocoder();
                geocoder.geocode({'latLng': myLatlng}, function(results, status) {
                 if (status == google.maps.GeocoderStatus.OK) {
                   if (results[3]) {
                     console.log(results);
                     $scope.map.setZoom(15);
                     infowindow.setContent(
                             "<strong>Su ubicación</strong><br/>"+
                             results[0].formatted_address
                             );
                     infowindow.open($scope.map, $scope.marker);
                     $scope.direccionBuscar = results[0].formatted_address;
                     $scope.setValuesResults(results);
                   }
                 } else {
                   alert("no se pudo determinar el nombre de ubicación : " + status);
                 } //end else

               }); //end geocoder

                google.maps.event.addListener($scope.marker, 'dragend', function () {
                    var pos = $scope.marker.getPosition();
                    console.log(pos);
                    $scope.direccionGuardada.lat = pos.lat();
                    $scope.direccionGuardada.lng = pos.lng();
                    $scope.ubicacionDelMapa();
                });

                console.log("centrar al mapa");
                $timeout(function () {
                    $scope.map.setCenter(myLatlng);
                }, 2000);
            };

            $scope.buscarDireccionEn = function(){
                $timeout(function(){
                    $scope.buscarDireccion();
                },1000);
            };

            $scope.buscarDireccion = function () {
                var geocoder = new google.maps.Geocoder();
                if (hasDireccionbuscar()) {
                    var direccionBuscar = $scope.direccionBuscar;
                } else {
                    alert("Favor de ingresar una direccion para buscar");
                    return;
                }

                console.log("Direccion Buscar:" + direccionBuscar);

                geocoder.geocode({'address': direccionBuscar}, function (results, status) {
                    // Verificamos el estatus
                    if (status == 'OK') {
                        // Si hay resultados encontrados, centramos y repintamos el mapa
                        // esto para eliminar cualquier pin antes puesto

                        console.log(results);
                        if(results[0].geometry.location){
                            $scope.direccionGuardada.lat = results[0].geometry.location.lat();
                            $scope.direccionGuardada.lng = results[0].geometry.location.lng();
                            //$scope.map.fitBounds(results[0].geometry.viewport);
                            //$scope.ubicacionDelMapa();
                            $scope.setValuesResults(results);
                        }else if (results[0].geometry.bounds) {
                            $scope.map.fitBounds(results[0].geometry.bounds);
                            console.log(results[0].address_components);
                        } else{
                            alert("No fue encontrada la localizacion");
                        }
                    } else {
                        // En caso de no haber resultados o que haya ocurrido un error
                        // lanzamos un mensaje con el error
                        if (direccionBuscar.value != "") {
                            alert("Geocoding no tuvo éxito debido a: " + status);
                        }
                    }
                });
                google.maps.event.trigger($scope.map, 'resize');
            };
        })

        .controller('CategoriasController', function ($scope, $state, $ionicPopup,
                                            Categorias, Buscador, Loader) {
            $scope.buscar = {producto: ''};
            Loader.showLoading("Cargando categorias...");
            $scope.categorias = Categorias.getCategorias().then(function (categorias) {
                $scope.$emit('ionic_push', 'inicializar');
                Loader.hideLoading();
                $scope.categorias = categorias;
            }, function (err) {
                Loader.hideLoading();
                //alert("Error: " + JSON.stringify(err));
                if (err.detail && err.detail == "Token inválido.") {
                    Loader.showLoading("Buscando registro...");
                    $scope.$emit("empty","iniciarlizar");
                    window.location.href = "./main.html";
                    Loader.hideLoading();
                }else if(err.detail){
                  $ionicPopup.alert({
                      title: 'Error en categorias!',
                      template: JSON.stringify(err)
                  });
                }else{
                  $scope.$emit("empty","iniciarlizar");
                  window.location.href = "./main.html";
                }
            });

            $scope.doBuscar = function () {
                console.log("Buscar " + $scope.buscar.producto);
                if($scope.buscar.producto.length==0 || /^\s*$/.test($scope.buscar.producto)){
                    $ionicPopup.alert({
                      title: 'Buscador',
                      template: 'Ingresa algun dato para buscar'
                  });
                }else{
                    Buscador.setQuery($scope.buscar);
                    $state.go('app.search')
                }
            };
        })

        .controller('SearchController', function ($scope, $ionicPopup, Buscador) {
            $scope.title = "Resultados";

            $scope.productos = Buscador.getProductos().then(function (productos) {
                $scope.productos = productos;
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en buscador',
                    template: err.detail
                });
            });

            $scope.verProducto = function (producto) {
                $state.go('app.detalle', {productoId: producto.id});
            };

        })
        .controller('ProductosController', function ($scope, $timeout, $stateParams, 
                        $ionicPopup, $state, Categorias, Productos) {

            $scope.title = "Productos";
            $scope.ordenar = 'name';

            Categorias.getCategoria($stateParams.categoriaId).then(function (categoria) {
                $scope.categoria = categoria;
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.title = $scope.categoria.name;
                    });
                }, 1000);
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en categoria!',
                    template: err.detail
                });
            });

            Productos.getProductos($stateParams.categoriaId).then(function (productos) {
                var products = [];
                for (var i = 0; i < productos.length; i++) {
                    if (productos[i].inventory > 0) {
                        products.push(productos[i]);
                    }
                }
                $scope.productos = products;
            }, function (err) {
                console.log(err);
                $ionicPopup.alert({
                    title: 'Error en productos!',
                    template: err.detail
                });
            });

            $scope.verProducto = function (producto) {
                $state.go('app.detalle', {productoId: producto.id});
            };

        })

        .controller('ProductoController', function ($scope, $stateParams, $ionicPopup, $timeout, $state, Productos,
                PedidosPeriodicos, Carrito, Descuentos) {
            
            $scope.subtotal = 0.0;
            $scope.descuento = 0.0;
            $scope.total = 0.0;
            $scope.title = "Detalle producto";
            
            Productos.getProducto($stateParams.productoId).then(function (producto) {
                $scope.producto = producto;
                $scope.producto.quantity = 1;
                $scope.producto = PedidosPeriodicos.configurarProducto($scope.producto);
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.title = $scope.producto.name;
                    });
                }, 500);
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en producto!',
                    template: err
                });
            });

            $scope.mostrarTotal = function () {
                $scope.descuento = Descuentos.calcularDescuento($scope.producto);
                $scope.subtotal += $scope.producto.price * $scope.producto.quantity;
                $scope.total = $scope.descuento - $scope.subtotal;
            };

            $scope.addCarrito = function (producto) {
                if (Carrito.addProducto(producto)) {
                    $scope.$emit('carrito', 'actualizacion');
                    $state.go('app.carrito');
                }
            };

        })

        .controller('CarritoController', function ($scope, $ionicPopup, 
                    $ionicModal, $timeout, Carrito, PedidosPeriodicos) {

            $scope.productos = Carrito.getProductos();
            $scope.totales = Carrito.getTotales();
            $scope.productoSeleccionado = {};

            $scope.mostrarTotal = function () {
                $scope.totales = Carrito.getTotales();
            };

            $scope.removeProducto = function (producto) {
                $ionicPopup.alert({
                    title: 'Quitando!',
                    template: 'Se quito del carrito'
                });
                $scope.productos = Carrito.removeProducto(producto);
                $scope.mostrarTotal();
                $scope.$emit('carrito', 'actualizacion');
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
                if (producto.periodico.pedido) {
                    $scope.productoSeleccionado = producto;
                    $scope.productoSeleccionado.periodico.pedido = true;
                    $scope.modalAgregarPedidoPeridico.show();
                }
                console.log(producto);
            };

            $scope.cancelarPedidoPeriodico = function () {
                for (var cont = 0; cont < $scope.productos.length; cont++) {
                    if ($scope.productos[cont].id == $scope.productoSeleccionado.id) {
                        $scope.productos[cont].periodico.pedido = false;
                        break;
                    }
                }
                $scope.productoSeleccionado = {};
                $scope.closeAgregarPedidoPeriodico();
            };

            $scope.agregarPedidoPeriodico = function () {
                /*PedidosPeriodicos.addPedido($scope.productoSeleccionado).then(function (pedido) {
                    
                }, function (err) {
                    //alert("Error en agregar pedido periodico");
                    $ionicPopup.alert({
                        title: 'Error en agregar pedido periodico!',
                        template: err.detail
                    });
                });*/
                $scope.$emit('periodicos', 'actualizacion');
                var product = $scope.productoSeleccionado;
                var leyenda = '';
                for (var cont = 0; cont < $scope.productos.length; cont++) {
                    if ($scope.productos[cont].id == product.id) {
                        if(product.periodico.period == 'por dia'){
                            var dias = product.periodico.days;
                            leyenda = "Recibirás el producto cada "+dias+" dias apartir de hoy";
                        }else if(product.periodico.period == 'semanal'){
                            var semanas = product.periodico.days;
                            product.periodico.days = 7 * semanas;
                            leyenda = "Recibirás el producto cada "+semanas+" semanas apartir de hoy";
                        }else if(product.periodico.period == 'mensual'){
                            var meses = product.periodico.days;
                            product.periodico.days = 30 * meses;
                            leyenda = "Recibirás el producto cada "+meses+" meses apartir de hoy";
                        }
                        $scope.productos[cont] = product;
                        $scope.productos[cont].periodico.leyend = leyenda;
                        break;
                    }
                }
                $scope.productoSeleccionado = {};
                $scope.closeAgregarPedidoPeriodico();
                console.log($scope.productos);
                Carrito.setProductos($scope.productos);
                $scope.$apply();
            };

        })
        .controller('PedidoController', function ($scope, $state, $ionicModal,
                $ionicPopup, $timeout, $cordovaGeolocation, User, Direcciones,
                Carrito, Loader) {


            $scope.hasProductsWithRecipe = Carrito.hasProductsWithRecipe(2);
            $scope.userData = User.getUser();
            $scope.direccionSeleccionada = {
                id: 0
            };
            $scope.direccionGuardada = Carrito.getDireccion();
            $scope.marker = null;
            $scope.platform = ionic.Platform.platform();
            $scope.marginTop = ($scope.platform == "android" ? '100px' : '50px');
            $scope.direcciones = [];
            $scope.colonias = [];
            $scope.mostrarMensajeMapa = true;

            $scope.$on("venta_empty", function (event, data) {
                console.log("venta empty pedido controller");
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.direccionGuardada = Carrito.getDireccion();
                        Direcciones.getDirecciones().then(function (direcciones) {
                            $scope.direcciones = [];
                            for(var cont = 0; cont < direcciones.length; cont++){
                                if(direcciones[cont].active==true){
                                    $scope.direcciones.push(direcciones[cont]);
                                }
                            }
                            if ($scope.direcciones.length == 1) {
                                $scope.direccionSeleccionada.id = $scope.direcciones[0].id;
                            }
                        }, function (err) {
                            console.log("Error al cargar direcciones");
                        });
                    });
                }, 1000);
            });

            Direcciones.getDirecciones().then(function (direcciones) {
                $scope.direcciones = [];
                for(var cont = 0; cont < direcciones.length; cont++){
                    if(direcciones[cont].active==true){
                        $scope.direcciones.push(direcciones[cont]);
                    }
                }
                if ($scope.direcciones.length == 1) {
                    $timeout(function () {
                        $scope.$apply(function () {
                            $scope.direccionSeleccionada.id = $scope.direcciones[0].id;
                        });
                    }, 1000);
                }else{
                    $timeout(function () {
                        $scope.$apply(function () {
                            $scope.direccionSeleccionada.id = 0;
                        });
                    }, 1000);
                }
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en recuperar direcciones!',
                    template: err.detail
                });
            });

            $scope.goToNotes = function(){
                $state.go('app.notas');
            };

            var recuperarDireccion = function() {
                if ($scope.direccionSeleccionada.id > 0) {
                    for (var cont = 0; cont <= $scope.direcciones.length; cont++) {
                        if ($scope.direcciones[cont].id == $scope.direccionSeleccionada.id) {
                            $scope.direccionGuardada = $scope.direcciones[cont];
                            $scope.colonias = [];
                            break;
                        }
                    }
                } else {
                    $scope.direccionGuardada = Direcciones.getDireccionVacia();
                    $scope.mostrarMapa = false;
                }
            };

            $scope.$watch("direccionSeleccionada.id",recuperarDireccion);

            $scope.doDireccion = function () {
                if ($scope.direccionGuardada.id) {
                    $scope.direccionSeleccionada.id = $scope.direccionGuardada.id;
                    for (var cont = 0; cont <= $scope.direcciones.length; cont++) {
                        if ($scope.direcciones[cont].id == $scope.direccionSeleccionada.id) {
                            $scope.direcciones[cont] = $scope.direccionGuardada;
                            Direcciones.updateDireccion(cont, $scope.direccionGuardada).then(function (direccion) {
                                Carrito.setDireccion(direccion);
                                $scope.colonias = [];
                                $scope.goToNotes();
                            }, function (err) {
                                $ionicPopup.alert({
                                    title: 'Error en actualizar direccion!',
                                    template: err.detail
                                });
                            });
                            break;
                        }
                    }
                } else {
                    confirmarUtilizarDireccionEnvio();
                    Direcciones.addDireccion($scope.direccionGuardada).then(function (direccion) {
                        Carrito.setDireccion(direccion);
                        $scope.colonias = [];
                        $scope.goToNotes();
                    }, function (err) {
                        $ionicPopup.alert({
                            title: 'Error en agregar direccion!',
                            template: err.detail
                        });
                    });
                }
            };

            $scope.$watch('direccionGuardada.postal_code', function () {
                if ($scope.direccionGuardada.postal_code.length == 5 && !$scope.direccionGuardada.id) {
                    Loader.showLoading("buscando codigo postal");
                    Direcciones.getDataPostalCode($scope.direccionGuardada.postal_code)
                            .then(function (data) {
                                $scope.direccionGuardada.location = data[0].estado;
                                $scope.direccionGuardada.delegation_municipaly = data[0].municipio;
                                $scope.direccionGuardada.colony = data[0].colonia;
                                if (data.length > 1) {
                                    $scope.colonias = [];
                                    for (var cont = 0; cont < data.length; cont++) {
                                        $scope.colonias.push(data[cont].colonia);
                                    }
                                }
                                Loader.hideLoading();
                            }, function (err) {
                                Loader.hideLoading();
                                $ionicPopup.alert({
                                    title: 'Error en recuperar datos de codigo postal!',
                                    template: err
                                });
                            });
                }
            });

            $scope.hasDireccionbuscar = function () {
                var direccionBuscar = document.getElementById('direccionBuscar');
                return direccionBuscar.value.length > 0;
            }

            function confirmarUtilizarDireccionEnvio () {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Confirmar utilizar direccion',
                    template: 'Deseas guardar la direccion para proximas entregas?',
                    cancelText: "No",
                    okText: "Si"
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        $scope.direccionGuardada.active = true;
                    } else {
                        $scope.direccionGuardada.active = false;
                    }
                });
            };

            $scope.confirmarSeleccionMapa = function () {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Confirmar direccion',
                    template: 'Es correcta la direccion ' + $scope.direccionBuscar + '?',
                    cancelText: "No",
                    okText: "Si"
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        //$scope.doDireccion();
                        $scope.hideModalMap();
                    } else {
                        $scope.direccionBuscar = "";
                        $scope.direccionBuscar.focus();
                    }
                });
            };

            $scope.centerOnMe = function () {
                if (!$scope.map)
                    return;
                $timeout(function(){
                    $scope.mostrarMensajeMapa = false;
                },4000);
                var posOptions = {timeout: 10000, enableHighAccuracy: true};
                $cordovaGeolocation
                        .getCurrentPosition(posOptions)
                        .then(function (position) {
                            Loader.hideLoading();
                            $scope.direccionGuardada.lat = position.coords.latitude;
                            $scope.direccionGuardada.lng = position.coords.longitude;
                            $scope.mostrarMapa = true;
                            $scope.ubicacionDelMapa(position);
                        }, function (err) {
                            $ionicPopup.alert({
                                title: 'Error de localizacion!',
                                template: 'No esta activa la localizacion'
                            });
                        });
            }

            $scope.mapCreated = function (map) {
                $scope.mostrarMensajeMapa = true;
                $scope.map = map;
                Loader.showLoading('cargando informacion...');
                if (!$scope.direccionGuardada.lat || $scope.direccionGuardada.lat == 0) {
                    $scope.centerOnMe();
                } else {
                    Loader.hideLoading();
                    $scope.ubicacionDelMapa();
                }
            };

            // Abrir el mapa en modal
            $scope.showModalMap = function () {
                Loader.showLoading("Abriendo el mapa");
                $ionicModal.fromTemplateUrl('templates/mapaModal.html', {
                    scope: $scope,
                    animation: 'slide-in-up',
                    focusFirstInput: true
                }).then(function (modal) {
                    Loader.hideLoading();
                    $scope.modal = modal;
                    $scope.modal.show();
                });
            };

            $scope.hideModalMap = function () {
                $scope.modal.hide();
                $scope.modal.remove();
            };

            $scope.setValuesResults = function (results) {
                var componentes = results[0].address_components;
                for (var cont = 0; cont < componentes.length; cont++) {
                    console.log(componentes[cont]);
                    if (componentes[cont].types.indexOf("postal_code") >= 0 ) {
                        $scope.direccionGuardada.postal_code = componentes[cont].long_name;
                        console.log($scope.direccionGuardada);
                    }else if(componentes[cont].types.indexOf("street_address") >= 0 ||
                        componentes[cont].types.indexOf("route") >= 0){
                        $scope.direccionGuardada.street = componentes[cont].long_name;
                    }else if(componentes[cont].types.indexOf("street_number") >= 0){
                        $scope.direccionGuardada.exterior_number= componentes[cont].short_name;
                    }else if(componentes[cont].types.indexOf("locality") >= 0){
                        $scope.direccionGuardada.location= componentes[cont].short_name;
                    }else if(componentes[cont].types.indexOf("sublocality") >= 0){
                        $scope.direccionGuardada.colony= componentes[cont].short_name;
                    }

                }
            };

            $scope.ubicacionDelMapa = function () {

                var myLatlng = new google.maps.LatLng($scope.direccionGuardada.lat, $scope.direccionGuardada.lng);

                if ($scope.marker) {
                    console.log("existe marker");
                    $scope.marker.setMap(null);
                }

                $scope.marker = new google.maps.Marker({
                    position: myLatlng,
                    map: $scope.map,
                    title: 'Mi ubicación',
                    draggable: true
                });

                var geocoder;
                var infowindow = new google.maps.InfoWindow({maxWidth:350});

                geocoder = new google.maps.Geocoder();
                geocoder.geocode({'latLng': myLatlng}, function(results, status) {
                 if (status == google.maps.GeocoderStatus.OK) {
                   if (results[3]) {
                     console.log(results);
                     $scope.map.setZoom(15);
                     infowindow.setContent(
                             "<strong>Su ubicación</strong><br/>"+
                             results[0].formatted_address
                             );
                     infowindow.open($scope.map, $scope.marker);
                     $scope.direccionBuscar = results[0].formatted_address;
                     $scope.setValuesResults(results);
                   }
                 } else {
                   alert("no se pudo determinar el nombre de ubicación : " + status);
                 } //end else

               }); //end geocoder

                google.maps.event.addListener($scope.marker, 'dragend', function () {
                    var pos = $scope.marker.getPosition();
                    console.log(pos);
                    $scope.direccionGuardada.lat = pos.lat();
                    $scope.direccionGuardada.lng = pos.lng();
                    $scope.ubicacionDelMapa();
                });

                console.log("centrar al mapa");
                $timeout(function () {
                    $scope.map.setCenter(myLatlng);
                }, 2000);
            };

            $scope.buscarDireccionEn = function(){
                $timeout(function(){
                    $scope.buscarDireccion();
                },1000);
            };

            $scope.buscarDireccion = function () {
                var geocoder = new google.maps.Geocoder();
                if (hasDireccionbuscar()) {
                    var direccionBuscar = $scope.direccionBuscar;
                } else {
                    alert("Favor de ingresar una direccion para buscar");
                    return;
                }

                console.log("Direccion Buscar:" + direccionBuscar);

                geocoder.geocode({'address': direccionBuscar}, function (results, status) {
                    // Verificamos el estatus
                    if (status == 'OK') {
                        // Si hay resultados encontrados, centramos y repintamos el mapa
                        // esto para eliminar cualquier pin antes puesto

                        console.log(results);
                        if(results[0].geometry.location){
                            $scope.direccionGuardada.lat = results[0].geometry.location.lat();
                            $scope.direccionGuardada.lng = results[0].geometry.location.lng();
                            //$scope.map.fitBounds(results[0].geometry.viewport);
                            //$scope.ubicacionDelMapa();
                            $scope.setValuesResults(results);
                        }else if (results[0].geometry.bounds) {
                            $scope.map.fitBounds(results[0].geometry.bounds);
                            console.log(results[0].address_components);
                        } else{
                            alert("No fue encontrada la localizacion");
                        }
                    } else {
                        // En caso de no haber resultados o que haya ocurrido un error
                        // lanzamos un mensaje con el error
                        if (direccionBuscar.value != "") {
                            alert("Geocoding no tuvo éxito debido a: " + status);
                        }
                    }
                });
                google.maps.event.trigger($scope.map, 'resize');
            };

        })

        .controller('NotasObservacionesController', function($scope, $state,
                    Carrito, $timeout){
            $scope.pedido = Carrito.getVenta();
            $scope.hasProductsWithRecipe = Carrito.hasProductsWithRecipe(2);

            function doPedido () {
                if (!Carrito.hasProductsWithRecipe(2)) {
                    $state.go('app.pago');
                } else {
                    $state.go('app.recetas');
                }
            };

            $scope.doNotas = function(){
                Carrito.setNotas($scope.pedido.notes);
                doPedido();
            };

            $scope.$on("venta_empty", function (event, data) {
                console.log("venta empty notas y observaciones");
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.pedido = Carrito.getVenta();
                    });
                }, 1000);
            });

        })
        .controller('RecetasController', function ($scope, $state, $ionicActionSheet,
                    ImageService, FileService, $timeout) {
                        
            $scope.images = FileService.recepies();

            $scope.urlForImage = function (imageName) {
                return FileService.getUrlForImage(imageName);
            };

            $scope.addMedia = function () {
                $scope.hideSheet = $ionicActionSheet.show({
                    buttons: [
                        {text: 'Tomar foto'},
                        {text: 'Foto de la galeria'}
                    ],
                    titleText: 'Agregar imagenes',
                    cancelText: 'Cancelar',
                    buttonClicked: function (index) {
                        $scope.addImage(index);
                    }
                });
            };

            $scope.addImage = function (type) {
                $scope.hideSheet();
                ImageService.handleMediaDialog(type, FileService.RECIPE_STORAGE_KEY).then(function () {
                    $scope.images = FileService.recepies();
                    $scope.$apply();
                });
            };

            $scope.removeImage = function (image) {
                FileService.removeImage(image, FileService.RECIPE_STORAGE_KEY).then(function(success){
                    $scope.images = FileService.recepies();
                    $scope.$apply();
                });
            };

            $scope.realizarPago = function () {
                $state.go('app.pago');
            };

            $scope.$on("venta_empty", function (event, data) {
                console.log("venta empty imagenes");
                $timeout(function () {
                    $scope.$apply(function () {
                        FileService.empty(FileService.RECIPE_STORAGE_KEY);
                    });
                }, 1000);
            });

        })

        .controller('PagoController', function ($scope, $ionicPopup, $state,
                    $ionicModal, $cordovaCamera, User, Carrito, FileService,
                    ImageService, UIOpenPay, Loader,$timeout, PedidosPeriodicos) {

            $scope.hasProductsWithRecipe = Carrito.hasProductsWithRecipe(2);
            $scope.tarjeta = Carrito.getTarjetaVacia();
            $scope.tarjetas = User.getTarjetas();
            $scope.user = User.getUser();
            $scope.venta = Carrito.getVenta();
            $scope.seleccion = {
              numero: 0
            };

            if($scope.tarjetas.length>0){
              $scope.seleccion.numero = $scope.tarjetas[0].id;
            }

            $scope.doPago = function () {
                if ($scope.seleccion.numero > 0) {
                    seleccionarTarjeta();
                } else if ($scope.tarjeta.card.number) {
                    Loader.showLoading('Enviando datos pago...');
                    if (!UIOpenPay.validarTarjeta($scope.tarjeta)) {
                        Loader.hideLoading();
                        $ionicPopup.alert({
                            title: 'Numero de tarjeta',
                            template: 'El numero de tarjeta no es valido'
                        });
                    } /*else if (!UIOpenPay.validarBrand($scope.tarjeta)) {
                        Loader.hideLoading();
                        $ionicPopup.alert({
                            title: 'Numero de tarjeta',
                            template: 'OpenPay no acepta pagos con American Express'
                        });
                    }*/ else if (!UIOpenPay.validarFechaExpiracion($scope.tarjeta)) {
                        Loader.hideLoading();
                        $ionicPopup.alert({
                            title: 'Fecha de expiración',
                            template: 'La fecha de expiración no es valida'
                        });
                    } else if (!UIOpenPay.validarCvc($scope.tarjeta)) {
                        Loader.hideLoading();
                        $ionicPopup.alert({
                            title: 'CVC',
                            template: 'Verifique el numero CVC de su tarjeta'
                        });
                    } else {
                        UIOpenPay.getTarjetaToken($scope.tarjeta).then(function (data) {
                            Loader.hideLoading();
                            if (data.error) {
                                $ionicPopup.alert({
                                    title: 'Error en registro de tarjeta!',
                                    template: data.message
                                });
                            } else {
                                enviarPedido();
                                console.log("Enviando pedido...");
                            }
                        }, function (err) {
                            console.log("Error en token de tarjeta: " + JSON.stringify(err));
                            Loader.hideLoading();
                            if (err.data.status) {
                                $ionicPopup.alert({
                                    title: err.message,
                                    template: err.data.description
                                });
                            } else {
                                $ionicPopup.alert({
                                    title: 'Error en registro de tarjeta!',
                                    template: "Error: " + JSON.stringify(err)
                                });
                            }
                        });
                    }
                } else {
                    $ionicPopup.alert({
                        title: 'Datos de tarjeta',
                        template: 'Ingrese los datos completo de la tarjeta'
                    });
                }
            };

            function seleccionarTarjeta(){
                var tarj = {};
                for(var cont=0; cont<$scope.tarjetas.length; cont++){
                    if($scope.seleccion.numero==$scope.tarjetas[cont].id){
                        tarj = $scope.tarjetas[cont];
                    }
                }
                if(tarj.id){
                    Carrito.setTarjeta(tarj);
                    if(!UIOpenPay.validarFechaExpiracion(tarj)){
                        Loader.hideLoading();
                        $ionicPopup.alert({
                            title: 'Fecha de expiración',
                            template: 'La fecha de expiración no es valida'
                        });
                    }else{
                        enviarPedido();
                    }
                }else{
                    $ionicPopup.alert({
                        title: 'Sin seleccion',
                        template: 'Selecciona la tarjeta a la cual se realizara el cobro.'
                    });
                }
            };

            function enviarDetallePedido(indice) {
                var indice = indice || 0;
                Loader.showLoading('Enviando detalle de pedido...');
                var productos = Carrito.getProductos();
                var images = FileService.images();
                Carrito.enviarDetalleVentas(indice).then(function (detalle) {
                    PedidosPeriodicos.addPedido(productos[indice],$scope.venta);
                    if (productos.length > (indice + 1)) {
                        enviarDetallePedido(indice + 1);
                    } else if (images.length > 0) {
                        Loader.hideLoading();
                        transferirImagenes();
                    } else {
                        Loader.hideLoading();
                        $scope.showPedidoRealizado();
                    }
                }, function (err) {
                    Loader.hideLoading();
                    $ionicPopup.alert({
                        title: 'Error subir el detalle del pedido!',
                        template: err.detail
                    });
                });
            };

            function enviarPedido() {
                $scope.venta = Carrito.getVenta();
                if ($scope.venta == undefined || $scope.venta.id == undefined) {
                    Loader.showLoading('Enviando pedido...');
                    Carrito.enviarPedido().then(function (venta) {
                        $scope.venta = venta;
                        Loader.hideLoading();
                        enviarDetallePedido();
                    }, function (err) {
                        Loader.hideLoading();
                        $ionicPopup.alert({
                            title: 'Error en procesar pedido!',
                            template: err.detail
                        });
                    });
                } else {
                    enviarDetallePedido();
                }
            };

            function transferirImagenes() {
                $scope.venta = Carrito.getVenta();
                var images = FileService.recepies();
                var cuantas = images.length, cont=0;
                Loader.showLoading('Subiendo: ' + cont + "/" + images.length);
                var params = {"venta": $scope.venta.id},
                headers = {"Accept":"application/json","Authorization": "Token " + User.getAuthToken()};
                ImageService.uploadRecepies(images, params, headers, function (result) {
                    //Error en agregar pedido periodico
                    //alert("SUCCESS: " + JSON.stringify(result));
                    cont++;
                    if(cuantas == cont){
                        $scope.showPedidoRealizado();
                    }else{
                        Loader.showLoading("Subiendo: " + cont + "/" + cuantas + " imagenes");
                    }

                }, function (err) {
                    //alert("ERROR: " + JSON.stringify(err));
                    cont++;
                    if(cuantas == cont){
                        $scope.showPedidoRealizado();
                    }else{
                        Loader.showLoading("Subiendo: " + cont + "/" + cuantas + " imagenes");
                    }
                });
            };

            // Creamos el modal para finalizar el pago
            $ionicModal.fromTemplateUrl('templates/pedidoRealizadoModal.html', {
                scope: $scope
            }).then(function (pedidoRealizado) {
                $scope.pedidoRealizado = pedidoRealizado;
            });

            // Accion para cerrar el pedidoRealizado
            $scope.closePedidoRealizado = function () {
                if ($scope.ranking.calificacion > 0) {
                    User.enviarCalificacion($scope.ranking);
                }
                $scope.pedidoRealizado.hide();
                //window.location.href="./main.html";
                $state.go('app.categorias');
            };

            $scope.ratingArr = [{
                    value: 1,
                    icon: 'ion-ios-star-outline'
                }, {
                    value: 2,
                    icon: 'ion-ios-star-outline'
                }, {
                    value: 3,
                    icon: 'ion-ios-star-outline'
                }, {
                    value: 4,
                    icon: 'ion-ios-star-outline'
                }, {
                    value: 5,
                    icon: 'ion-ios-star-outline'
                }];

            $scope.ranking = {
                'calificacion': 0,
                'comentario': "",
            };

            $scope.setRating = function (val) {
                $scope.ranking.calificacion = val;
                var rtgs = $scope.ratingArr;
                for (var i = 0; i < rtgs.length; i++) {
                    if (i < val) {
                        rtgs[i].icon = 'ion-ios-star';
                    } else {
                        rtgs[i].icon = 'ion-ios-star-outline';
                    }
                }
            };

            // Accion para mostrar el pedidoRealizado
            $scope.showPedidoRealizado = function () {
                Carrito.cerrarPedido().then(function (data) {
                    Carrito.empty();
                    $scope.$emit('carrito', 'actualizacion');
                    $scope.$emit('venta', 'inicializar');
                    $scope.pedidoRealizado.show();
                }, function (err) {
                    $ionicPopup.alert({
                        title: 'Error en cerrar pedido!',
                        template: err.detail
                    });
                });
            };

            $scope.$on("venta_empty", function (event, data) {

                console.log("venta empty pagocontroller");
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.tarjeta = Carrito.getTarjetaVacia();
                        $scope.tarjetas = User.getTarjetas();
                        $scope.user = User.getUser();
                        $scope.venta = Carrito.getVenta();
                        $scope.seleccion = 0;
                    });
                }, 1000);
            });

            $scope.validar = {terminos: false};

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

        })
        .controller('PedidosPeriodicosController', function ($scope, $timeout, $ionicPopup, PedidosPeriodicos, Loader) {
            PedidosPeriodicos.getPedidos().then(function (pedidos) {
                $scope.pedidos = PedidosPeriodicos.configurarPedidos(pedidos);
                console.log(pedidos);
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en pedidos periodicos!',
                    template: err.detail
                });
            });

            $scope.removePedido = function (pedido) {
                $scope.pedidos = PedidosPeriodicos.removePedido(pedido);
                $scope.$emit('periodicos', 'actualizacion');
            };

            $scope.cambioPedido = function (pedido) {
                PedidosPeriodicos.editPedido(pedido);
                console.log(pedido);
            };
        })
        .controller('ContactoController', function ($scope, $state, $ionicPopup, Contacto) {
            $scope.contactoData = {
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            };

            $scope.doContacto = function () {
                Contacto.contacto($scope.contactoData).then(function(data){
                    $ionicPopup.alert({
                        title: 'Enviando...',
                        template: 'Gracias por enviar tus comentarios'
                    });
                }, function(err){
                    console.log(err);
                    //alert("Error: " + JSON.stringify(err));
                    $ionicPopup.alert({
                        title: 'Error en contacto',
                        template: err.detail
                    });
                });
            };
        })
        .controller('PreguntasController', function ($scope, $ionicPopup, Preguntas) {
            $scope.preguntas = [];
            Preguntas.getPreguntas().then(function (preguntas) {
                $scope.preguntas = preguntas;
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en preguntas',
                    template: err.detail
                });
            })
        })
        .controller('RecordatoriosController', function ($scope, $timeout,
        $state, Recordatorios) {

            $scope.recordatorios = Recordatorios.get();

            console.log($scope.recordatorios);

            $scope.addRecordatorio = function () {
                $state.go('app.addRecordatorio');
            };

            $scope.updateRecordatorio = function(){
                Recordatorios.add()
            };

            $scope.$on("recordatorios_actualizar",function(event, data){
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.recordatorios = Recordatorios.get();
                    });
                }, 1000);
            });
        })
        .controller('RecordatorioController', function ($scope, $stateParams,
                   $ionicPopup,  Recordatorios, $state) {

            $scope.recordatorio = Recordatorios.find($stateParams.recordatorioId);

            $scope.borrarRecordatorio = function(recordatorio){
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Confirmar eliminar recordatorio',
                    template: 'Desea eliminar el recordatorio?',
                    cancelText: "No",
                    okText: "Si"
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        console.log(recordatorio);
                        Recordatorios.delete(recordatorio);
                        $scope.$emit('recordatorios', 'add');
                        $state.go('app.recordatorios');
                    }
                });
            };

        })
        .controller('FormRecordatorioController', function ($scope, $state,
            $stateParams, $ionicNavBarDelegate, Recordatorios) {

            if($stateParams.recordatorioId){
                $scope.recordatorio = Recordatorios.find($stateParams.recordatorioId);
                $ionicNavBarDelegate.title("Editar recordatorio");
                $scope.title = "Editar recordatorio";
                var leyenda = Recordatorios.getLeyendEdit($scope.recordatorio);
                $scope.seleccion = {'repetir': leyenda};
                console.log("Entro a la configuracion de edit");
            }else{
                $scope.recordatorio = Recordatorios.getEmpty();
                $ionicNavBarDelegate.title("Agregar recordatorio");
                $scope.title = "Agregar recordatorio";
                $scope.seleccion = {'repetir': 'Todos los dias'};
                console.log("Entro a la configuracion de add")
                console.log($scope.recordatorio);
            }



            $scope.$watch('seleccion.repetir',function(){
                if($scope.recordatorio && $scope.seleccion.repetir=="Todos los dias"){
                    $scope.recordatorio.allDays = true;
                    $scope.recordatorio.weekend = false;
                    $scope.recordatorio.monday = true;
                    $scope.recordatorio.tuesday = true;
                    $scope.recordatorio.wednesday = true;
                    $scope.recordatorio.thursday = true;
                    $scope.recordatorio.friday = true;
                    $scope.recordatorio.saturday = true;
                    $scope.recordatorio.sunday = true;
                }else if($scope.recordatorio && $scope.seleccion.repetir == "Sabado y Domingo"){
                    $scope.recordatorio.allDays = false;
                    $scope.recordatorio.weekend = true;
                    $scope.recordatorio.monday = false;
                    $scope.recordatorio.tuesday = false;
                    $scope.recordatorio.wednesday = false;
                    $scope.recordatorio.thursday = false;
                    $scope.recordatorio.friday = false;
                    $scope.recordatorio.saturday = true;
                    $scope.recordatorio.sunday = true;
                }else if($scope.recordatorio && $scope.seleccion.repetir == "Lunes a Viernes"){
                    $scope.recordatorio.allDays = false;
                    $scope.recordatorio.weekend = false;
                    $scope.recordatorio.monday = true;
                    $scope.recordatorio.tuesday = true;
                    $scope.recordatorio.wednesday = true;
                    $scope.recordatorio.thursday = true;
                    $scope.recordatorio.friday = true;
                    $scope.recordatorio.saturday = false;
                    $scope.recordatorio.sunday = false;
                }

            });

            $scope.add = function () {
                if($scope.recordatorio.id == 0){
                    Recordatorios.add($scope.recordatorio);
                    $scope.recordatorio = Recordatorios.getEmpty();
                    $scope.$emit('recordatorios', 'add');
                    $state.go('app.recordatorios');
                }else{
                    $scope.edit($scope.recordatorio);
                }
            };

            $scope.edit = function () {
                Recordatorios.update($scope.recordatorio);
                $state.go('app.recordatorios');
            };

            $scope.changeTime = function(){
                $scope.recordatorio.time = Recordatorios.getParseTime($scope.recordatorio);
                console.log($scope.recordatorio);
            }

        })
        .controller('VentaController', function ($scope, $stateParams,
                   $ionicPopup,  Pedidos, $state, $ionicNavBarDelegate) {

            Pedidos.getPedido($stateParams.pedidoId).then(function(data){
                $scope.pedido = data;
                console.log($scope.pedido);
                $ionicNavBarDelegate.title("Pedido: #" + $scope.pedido.id);
            },function(err){
                $ionicPopup.alert({
                    title: 'Error en ventas',
                    template: err.detail
                });
            });

            $scope.removeProducto = function(producto){
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Confirmacion',
                    template: 'Desea eliminar el producto del pedido?',
                    cancelText: "No",
                    okText: "S i"
                });
                confirmPopup.then(function (res) {
                    if (res) {
                        console.log(recordatorio);
                        Recordatorios.delete(recordatorio);
                        $scope.$emit('recordatorios', 'add');
                        $state.go('app.recordatorios');
                    }
                });
            };

        })
        ;
