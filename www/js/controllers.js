angular.module('farmApp.controllers', ['farmApp.services', 'ngCordova'])
        .controller('AppController', function ($scope, $state, $timeout, User, Carrito, PedidosPeriodicos) {
            if (!User.hasToken()) {
                $state.go('inicio');
            } else {
                $scope.user = User.getUser();
            }
            $scope.closeLogin = function () {
                User.logout().then(function (data) {
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

        })
        .controller('DefaultController', function ($scope, $state, User) {
            $scope.user = User.getUser();
            if (User.hasUser()) {
                $state.go('app.categorias');
            }


        })
        .controller('LoginController', function ($scope, $ionicPopup, $ionicModal, $state, User, Loader) {
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
                            // error case
                            alert("error en login " + JSON.stringify(err));

                            $ionicPopup.alert({
                                title: 'Login error!',
                                template: err.detail
                            });
                        });
            }
            function get_me() {
                User.me().then(function (user) {
                    Loader.hideLoading();
                    $scope.user = user;
                    $state.go('app.categorias');
                }, function (err) {
                    alert("error en user_me " + JSON.stringify(err));
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
                console.log('Doing recuperar, aun en desarrollo', $scope.recuperarData);

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

        .controller('RegistroController', function ($scope, $ionicPopup, $ionicModal, $state, User, Loader) {
            $scope.data = {};
            $scope.doRegister = function () {
                var todoCorrecto = true;
                var formulario = document.forms[0];
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

        .controller('PerfilController', function ($scope, $ionicPopup, $cordovaGeolocation, $timeout,
                $ionicLoading, $ionicModal, User, Direcciones, Pedidos, Loader,
                $cordovaCamera, $cordovaFile, FileService, $cordovaFileTransfer) {

            $scope.userData = User.getUser();
            $scope.direccionBuscar = "";
            $scope.direccionGuardada = Direcciones.getDireccionVacia();
            $scope.marker = null;
            $scope.platform = ionic.Platform.platform();
            $scope.marginTop = ($scope.platform == "android" ? '100px' : '50px');
            $scope.direcciones = [];
            $scope.colonias = [];
            $scope.pedidos = [];
            $scope.mostrarMensajeMapa = true;
            $scope.inapam = JSON.parse(window.localStorage['inapam'] || '[]');
            Direcciones.getDirecciones().then(function (direcciones) {
                $scope.direcciones = direcciones;
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
                            alert(formulario[i].name);
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
                var url = FileService.urlForImage(image);
                return url;
            };

            $scope.removeImage = function () {
                var name = $scope.inapam[0].substr($scope.inapam[0].lastIndexOf('/') + 1);
                $cordovaFile.removeFile(cordova.file.dataDirectory, name)
                        .then(function (success) {
                            $scope.inapam = [];
                            window.localStorage.setItem('inapam', JSON.stringify($scope.inapam));
                            alert("Archivo eliminado");
                        }, function (error) {
                            alert("No es posible eliminar el archivo");
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
                        $scope.modalInapam.hide();
                        $scope.modalInapam.remove();
                        $scope.userData.inapam = false;
                    };

                    function optionsForType(indice) {
                        var source;
                        switch (indice) {
                            case 0:
                                source = Camera.PictureSourceType.CAMERA;
                                break;
                            case 1:
                                source = Camera.PictureSourceType.PHOTOLIBRARY;
                                break;
                        }
                        return {
                            destinationType: Camera.DestinationType.FILE_URI,
                            sourceType: source,
                            allowEdit: false,
                            encodingType: Camera.EncodingType.JPEG,
                            popoverOptions: CameraPopoverOptions,
                            saveToPhotoAlbum: false
                        };
                    }

                    $scope.addImage = function (indice) {
                        var options = optionsForType(indice);
                        $cordovaCamera.getPicture(options).then(function (imageData) {
                            onImageSuccess(imageData);
                            function onImageSuccess(fileURI) {
                                createFileEntry(fileURI);
                            }
                            function createFileEntry(fileURI) {
                                window.resolveLocalFileSystemURL(fileURI, copyFile, fail);
                            }
                            function copyFile(fileEntry) {
                                var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
                                var newName = makeid() + name;

                                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (fileSystem2) {
                                    fileEntry.copyTo(
                                            fileSystem2,
                                            newName,
                                            onCopySuccess,
                                            fail
                                            );
                                }, fail);
                            }
                            function onCopySuccess(entry) {
                                $scope.$apply(function () {
                                    $scope.inapam.push(entry.nativeURL);
                                    window.localStorage.setItem('inapam', JSON.stringify($scope.inapam));
                                });
                            }
                            function fail(error) {
                                console.log("fail: " + error.code);
                            }
                            function makeid() {
                                var text = "";
                                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                for (var i = 0; i < 5; i++) {
                                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                                }
                                return text;
                            }
                        }, function (err) {
                            console.log(err);
                        });
                    };

                    function getImageUploadOptions(imageURI, params, headers) {
                        var options = new FileUploadOptions();
                        options.fileKey = "inapam";
                        options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
                        options.mimeType = "image/" + imageURI.substr(imageURI.lastIndexOf('.') + 1);
                        options.params = params;
                        options.httpMethod = "POST";
                        options.headers = headers;
                        alert(JSON.stringify(options));
                        return options;
                    }

                    $scope.confirmarFotoInapam = function () {
                        var user = User.getUser();
                        var token = User.getAuthToken();
                        var params = {"active": false },
                        headers = {"Content-Type": "application/json", "Authorization": "Token " + token};
                        var urlImage = $scope.inapam[0];
                        var url = "http://farmaapp.mx/api/images/inapam/";
                        var options = getImageUploadOptions(urlImage, params, headers);
                        $cordovaFileTransfer.upload(url, urlImage, options).then(function (result) {
                            //console.log("SUCCESS: " + JSON.stringify(result.response));
                            alert("SUCCESS: " + JSON.stringify(result.response));
                        }, function (err) {
                            //console.log("ERROR: " + JSON.stringify(err));
                            alert("ERROR: " + JSON.stringify(err));
                        }, function (progress) {
                            // PROGRESS HANDLING GOES HERE
                        });
                    };

                }
            });

            $scope.recuperarDireccion = function () {
                var select = document.getElementById('recuperar-direccion');
                if (select.value != "") {
                    for (var cont = 0; cont <= $scope.direcciones.length; cont++) {
                        if ($scope.direcciones[cont].street == select.value) {
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

            $scope.doDireccion = function () {
                var select = document.getElementById('recuperar-direccion');
                if ($scope.direccionGuardada.id) {
                    select.value = $scope.direccionGuardada.street;
                    for (var cont = 0; cont <= $scope.direcciones.length; cont++) {
                        if ($scope.direcciones[cont].street == select.value) {
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

        .controller('CategoriasController', function ($scope, $state, $ionicPopup, Categorias, Buscador, Loader) {
            $scope.buscar = Buscador.getQuery();
            Loader.showLoading("Cargando categorias...");
            $scope.categorias = Categorias.getCategorias().then(function (categorias) {
                Loader.hideLoading();
                $scope.categorias = categorias;
            }, function (err) {
                Loader.hideLoading();
                $ionicPopup.alert({
                    title: 'Error en categorias!',
                    template: err.detail
                });
                if (err.detail == "Token inválido.") {
                    window.localStorage.removeItem('user');
                    window.localStorage.removeItem('access_token');
                    window.location.href = "/app/categorias";
                }
            });

            $scope.doBuscar = function () {
                console.log("Buscar " + $scope.buscar.producto);
                Buscador.setQuery($scope.buscar);
                $state.go('app.search')
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
        .controller('ProductosController', function ($scope, $timeout, $stateParams, $ionicPopup, $state, Categorias, Productos) {

            $scope.title = "Productos";
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

        .controller('CarritoController', function ($scope, $ionicPopup, $ionicModal, $timeout, Carrito,
                PedidosPeriodicos) {

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
                    $scope.modalAgregarPedidoPeridico.show();
                }
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
                PedidosPeriodicos.addPedido($scope.productoSeleccionado).then(function (pedido) {
                    $scope.$emit('periodicos', 'actualizacion');
                    for (var cont = 0; cont < $scope.productos.length; cont++) {
                        if ($scope.productos[cont].id == $scope.productoSeleccionado.id) {
                            $scope.productos[cont] = PedidosPeriodicos.configurarProducto($scope.productos[cont]);
                            break;
                        }
                    }
                    $scope.productoSeleccionado = {};
                    $scope.closeAgregarPedidoPeriodico();
                }, function (err) {
                    alert("Error en agregar pedido periodico");
                });
            };

        })
        .controller('PedidoController', function ($scope, $state, $ionicModal, $ionicPopup, $timeout,
                $cordovaGeolocation, User, Direcciones, Carrito, Loader) {
            $scope.userData = User.getUser();
            $scope.direccionSeleccionada = "";
            $scope.direccionGuardada = Carrito.getDireccion();
            $scope.marker = null;
            $scope.platform = ionic.Platform.platform();
            $scope.marginTop = ($scope.platform == "android" ? '100px' : '50px');
            $scope.direcciones = [];
            $scope.colonias = [];
            $scope.mostrarMensajeMapa = true;
            Direcciones.getDirecciones().then(function (direcciones) {
                $scope.direcciones = [];
                for(var cont = 0; cont < direcciones.length; cont++){
                    if(direcciones[cont].active==true){
                        $scope.direcciones.push(direcciones[cont]);
                    }
                }
                if ($scope.direcciones.length == 1) {
                    var select = document.getElementById('recuperar-direccion');
                    select.value = $scope.direcciones[0].street;
                }
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en recuperar direcciones!',
                    template: err.detail
                });
            });


            $scope.doPedido = function () {
                var productos = Carrito.getProductos();
                var encontrado = false;
                for (var cont = 0; cont < productos.length; cont++) {
                    if (productos[cont].recipe > 1 ) {
                        encontrado = true;
                        break
                    }
                }
                if (!encontrado) {
                    $state.go('app.pago');
                } else {
                    $state.go('app.recetas');
                }

            };

            $scope.recuperarDireccion = function () {
                var select = document.getElementById('recuperar-direccion');
                if (select.value != "") {
                    for (var cont = 0; cont <= $scope.direcciones.length; cont++) {
                        if ($scope.direcciones[cont].street == select.value) {
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

            $scope.doDireccion = function () {
                var select = document.getElementById('recuperar-direccion');
                if ($scope.direccionGuardada.id) {
                    select.value = $scope.direccionGuardada.street;
                    for (var cont = 0; cont <= $scope.direcciones.length; cont++) {
                        if ($scope.direcciones[cont].street == select.value) {
                            $scope.direcciones[cont] = $scope.direccionGuardada;
                            Direcciones.updateDireccion(cont, $scope.direccionGuardada).then(function (direccion) {
                                Carrito.setDireccion(direccion);
                                $scope.colonias = [];
                                $scope.doPedido();
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
                        $scope.doPedido();
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

        .controller('ImageController', function ($scope, $state, $ionicActionSheet, ImageService, FileService) {
            $scope.images = FileService.images();

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
                ImageService.handleMediaDialog(type).then(function () {
                    $scope.$apply();
                });
            };

            $scope.realizarPago = function () {
                $state.go('app.pago');
            };

        })

        .controller('PagoController', function ($scope, $ionicPopup, $state, $ionicModal, $cordovaCamera,
                User, Carrito, FileService, ImageService, UIConekta, Loader) {
            $scope.tarjeta = Carrito.getTarjeta();
            $scope.user = User.getUser();
            $scope.venta = Carrito.getVenta();
            $scope.productos = Carrito.getProductos();
            $scope.images = FileService.images();
            $scope.doPago = function () {
                var tarjeta = $scope.tarjeta;
                if (tarjeta.token) {
                    enviarPedido();
                } else if (tarjeta.card.number) {
                    Loader.showLoading('Enviando datos pago...');
                    UIConekta.getTarjetaToken(tarjeta).then(function (token) {
                        Loader.hideLoading();
                        enviarPedido();
                    }, function (err) {
                        Loader.hideLoading();
                        $ionicPopup.alert({
                            title: 'Error token de tarjeta!',
                            template: err.message
                        });
                    });
                } else {
                    $ionicPopup.alert({
                        title: 'Datos de tarjeta',
                        template: 'Ingrese los datos completo de la tarjeta'
                    });
                }
            };

            function enviarDetallePedido(indice) {
                var indice = indice || 0;
                Loader.showLoading('Enviando detalle de pedido...');
                Carrito.enviarDetalleVentas(indice).then(function (detalle) {
                    if ($scope.productos.length > (indice + 1)) {
                        enviarDetallePedido(indice + 1);
                    } else if ($scope.images.length > 0) {
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
            }
            ;

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
            }
            ;

            function transferirImagenes() {
                $scope.venta = Carrito.getVenta();
                var cont = images.length;
                Loader.showLoading('Subiendo: ' + cont + "/" + images.length);
                var params = {'venta': $scope.venta.id},
                headers = {"Content-Type": "application/json", "Authorization": "Token " + User.getAuthToken()};
                ImageService.upload($scope.images, params, headers, function (result) {
                    console.log("SUCCESS: " + JSON.stringify(result.response));
                    cont--;
                    if (cont <= 0) {
                        Loader.showLoading('Subiendo: ' + cont + "/" + images.length);
                    } else {
                        $scope.showPedidoRealizado();
                    }
                }, function (err) {
                    console.log("ERROR: " + JSON.stringify(err));
                    cont--;
                    if (cont <= 0) {
                        Loader.showLoading('Subiendo: ' + cont + "/" + images.length);
                    } else {
                        $scope.showPedidoRealizado();
                    }
                });
            }
            ;

            // Creamos el modal para finalizar el pago
            $ionicModal.fromTemplateUrl('templates/pedidoRealizadoModal.html', {
                scope: $scope
            }).then(function (pedidoRealizado) {
                $scope.pedidoRealizado = pedidoRealizado;
            });

            // Accion para cerrar el pedidoRealizado
            $scope.closePedidoRealizado = function () {
                if ($scope.calificacion > 0) {
                    User.enviarCalificacion($scope.calificacion);
                }
                $scope.pedidoRealizado.hide();
                window.location.href="/categorias";
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

            $scope.calificacion = 0;

            $scope.setRating = function (val) {
                $scope.calificacion = val;
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
                    $scope.pedidoRealizado.show();
                }, function (err) {
                    $ionicPopup.alert({
                        title: 'Error en cerrar pedido!',
                        template: err.detail
                    });
                });
            };
        })
        .controller('PedidosPeriodicosController', function ($scope, $timeout, $ionicPopup, PedidosPeriodicos, Loader) {
            PedidosPeriodicos.getPedidos().then(function (pedidos) {
                $scope.pedidos = pedidos;
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
        .controller('ContactoController', function ($scope, $state, $ionicPopup, $cordovaEmailComposer) {
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
        .controller('PreguntasController', function ($scope, $ionicPopup, Preguntas) {
            $scope.preguntas = [];
            Preguntas.getPreguntas().then(function (preguntas) {
                $scope.preguntas = preguntas;
            }, function (err) {
                $ionicPopup.alert({
                    title: 'Error en preguntas',
                    template: err
                });
            })
        })
        .controller('NotificacionesController', function ($scope, $timeout,
        $state, NotificacionLocal) {

            $scope.notificaciones = NotificacionLocal.get();

            $scope.addNotificacion = function () {
                $state.go('app.addNotificacion');
            };
            
            $scope.$on("notificaciones", function (event, data) {
                $timeout(function () {
                    $scope.$apply(function () {
                        $scope.notificaciones = NotificacionLocal.get();
                    });
                }, 1000);
            });
            
        })
        .controller('NotificacionController', function ($scope, $stateParams, $ionicModal,
        $state, NotificacionLocal) {

            $scope.notificacion = NotificacionLocal.find($stateParams.notificacionId);

        })
        .controller('FormNotificacionController', function ($scope, $state, NotificacionLocal) {

            
            $scope.objNotificacion = NotificacionLocal.getEmpty();
            
            $scope.seleccion = {'repetir': 'Todos los dias'};
            $scope.objNotificacion.repetir.todosLosDias = true;
            
            $scope.$watch('seleccion.repetir',function(){
                if($scope.seleccion.repetir=="Todos los dias"){
                    $scope.objNotificacion.repetir.todosLosDias = true;
                }else if($scope.seleccion.repetir == "Sabado y Domingo"){
                    $scope.objNotificacion.repetir.todosLosDias = false;
                    $scope.objNotificacion.repetir.domingo = true;
                    $scope.objNotificacion.repetir.sabado = true;
                }else if($scope.seleccion.repetir == "Personalizar"){
                    $scope.objNotificacion.repetir.todosLosDias = false;
                    $scope.objNotificacion.repetir.domingo = false;
                    $scope.objNotificacion.repetir.sabado = false;
                }
            });
            
            $scope.add = function () {
                NotificacionLocal.add($scope.objNotificacion);
                $scope.objNotificacion = NotificacionLocal.getEmpty();
                $scope.$emit('notificaciones', 'add');
                $state.go('app.notificaciones');
            };
        })
        ;
