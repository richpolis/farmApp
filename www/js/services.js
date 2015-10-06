angular.module('farmApp.services', [])
        .factory('Loader', ['$ionicLoading', '$timeout',
            function($ionicLoading, $timeout) {
                return {
                    showLoading: function(text) {
                        text = text || 'Loading...';
                        $ionicLoading.show({
                            template: text
                        });
                    },
                    hideLoading: function() {
                        $ionicLoading.hide();
                    },
                    toggleLoadingWithMessage: function(text, timeout) {
                        $rootScope.showLoading(text);
                        $timeout(function() {
                            $rootScope.hideLoading();
                        }, timeout || 3000);
                    }
                };
        }])
        .factory('FileService', function() {
            var images;
            var IMAGE_STORAGE_KEY = 'images';

            return {
                storeImage: function(img) {
                    images.push(img);
                    window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
                },
                images: function() {
                    var img = window.localStorage.getItem(IMAGE_STORAGE_KEY);
                    if (img) {
                        images = JSON.parse(img);
                    } else {
                        images = [];
                    }
                    return images;
                },
                getUrlForImage: function(imageName) {
                    var trueOrigin = cordova.file.dataDirectory + imageName;
                    return trueOrigin;
                },
                empty: function(){
                    images=[];
                    window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
                }


            }
        })
        .factory('ImageService', function($cordovaCamera, FileService, $q, $cordovaFile, URL_BASE, API_PATH) {

                function makeid() {
                    var text = '';
                    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

                    for (var i = 0; i < 5; i++) {
                        text += possible.charAt(Math.floor(Math.random() * possible.length));
                    }
                    return text;
                };

                function optionsForType(type) {
                    var source;
                    switch (type) {
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
            };

            function saveMedia(type) {
                return $q(function(resolve, reject) {
                    var options = optionsForType(type);

                    $cordovaCamera.getPicture(options).then(function(imageUrl) {
                        var name = imageUrl.substr(imageUrl.lastIndexOf('/') + 1);
                        var namePath = imageUrl.substr(0, imageUrl.lastIndexOf('/') + 1);
                        var newName = makeid() + name;
                        $cordovaFile.copyFile(namePath, name, cordova.file.dataDirectory, newName)
                            .then(function(info) {
                                FileService.storeImage(newName);
                                resolve();
                            }, function(e) {
                                reject();
                            });
                    });
                })
            };

            function getImageUploadOptions(imageURI, params, headers) {
                var options = new FileUploadOptions();
                options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1);
                options.mimeType = "image/" + imageURI.substr(imageURI.lastIndexOf('.')+1);
                options.params = params;
                options.httpMethod = "POST";
                options.headers = headers;
                /*uploadOptions.headers = {
                    Connection:"close"
                };*/
                return options;
            }

            function savedFile(file, cb) {
                return function () {
                    cb(file);
                };
            }

            return {
                handleMediaDialog: saveMedia,
                upload: function (images, params, headers, onSuccess, onError) {
                    var ft =  new FileTransfer();
                    for (var i = 0; i < images.length; i++) {
                        var image = images[i];
                        var urlImage = FileService.getUrlForImage(image);
                        ft.upload(urlImage,
                            encodeURI(BASE_URL.urlBase + API_PATH.images_ventas),
                            savedFile(image, onSuccess), onError, getImageUploadOptions(urlImage, params, headers));
                    }
                }
            }
        })
        .factory('User', function ($http, $timeout, $q, URL_BASE, AUTH_PATH, API_PATH) {
            var accessToken;
            var user;
            user = JSON.parse(window.localStorage['user'] || '{}');
            accessToken = JSON.parse(window.localStorage['access_token'] || '{}');
            function request(args) {
                // Let's retrieve the token from the cookie, if available
                if(accessToken.auth_token){
                    $http.defaults.headers.common.Authorization = 'Token ' + accessToken.auth_token;
                }
                // Continue
                params = args.params || {};
                args = args || {};
                var deferred = $q.defer(),
                    url = this.API_URL + args.url,
                    method = args.method || "GET",
                    params = params,
                    data = args.data || {};
                // Fire the request, as configured.
                $http({
                    url: URL_BASE.urlBase + url,
                    method: method.toUpperCase(),
                    headers: {"Content-Type": "application/json"},
                    params: params,
                    data: data
                })
                    .success(angular.bind(this,function(data, status, headers, config) {
                        deferred.resolve(data, status);
                    }))
                    .error(angular.bind(this,function(data, status, headers, config) {
                        console.log("error syncing with: " + url);
                        // Set request status
                        if(data){
                            data.status = status;
                        }
                        if(status == 0){
                            if(data == ""){
                                data = {};
                                data['status'] = 0;
                                data['non_field_errors'] = ["Could not connect. Please try again."];
                            }
                            // or if the data is null, then there was a timeout.
                            if(data == null){
                                // Inject a non field error alerting the user
                                // that there's been a timeout error.
                                data = {};
                                data['status'] = 0;
                                data['non_field_errors'] = ["Server timed out. Please try again."];
                            }
                        }
                        deferred.reject(data, status, headers, config);
                    }));
                return deferred.promise;
            };
            function user_login(email, password) {
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + AUTH_PATH.login,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: {"email": email, "password": password}
                };
                console.log(configHttp);
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                accessToken = data;
                                // Set the token as header for your requests!
                                $http.defaults.headers.common['Authorization'] = 'Token ' + accessToken.auth_token;
                                window.localStorage.setItem('access_token', JSON.stringify(accessToken));
                                console.log(accessToken);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };
            function user_logout() {
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + AUTH_PATH.logout,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                accessToken = {};
                                delete $http.defaults.headers.common.Authorization;
                                user = {};
                                window.localStorage.setItem('user', JSON.stringify(user));
                                window.localStorage.setItem('access_token', JSON.stringify(accessToken));
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });

            };

            function user_me() {
                var configHttp = {
                    method: "GET",
                    url: URL_BASE.urlBase + API_PATH.usuarios,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (usuarios) {
                                user = usuarios[0];
                                window.localStorage.setItem('user', JSON.stringify(user));
                                resolve(user);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };
            function user_register(objUser) {
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + AUTH_PATH.register,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: {
                        "email": objUser.email,
                        "password": objUser.password,
                        "first_name": objUser.first_name,
                        "last_name": objUser.last_name,
                        "cell": objUser.cell
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                user = data;
                                window.localStorage.setItem('user', JSON.stringify(user));
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            }
                            );
                });
            };
            function user_update(objUser) {
                var configHttp = {
                    method: "PATCH",
                    url: URL_BASE.urlBase + AUTH_PATH.me,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    },
                    data: {
                        "first_name": objUser.first_name,
                        "last_name": objUser.last_name,
                        "cell": objUser.cell
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                user = data;
                                window.localStorage.setItem('user', JSON.stringify(user));
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };

            return {
                login: user_login,
                logout: user_logout,
                me: user_me,
                register: user_register,
                update: user_update,
                changePassword: function(objUser){
                    var configHttp = {
                        method: "POST",
                        url: URL_BASE.urlBase + AUTH_PATH.change_password,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + accessToken.auth_token
                        },
                        data: {
                            "new_password": objUser.new_password,
                            "current_password": objUser.password
                        }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                },
                hasUser: function () {
                    return user.email;
                },
                getUser: function () {
                    return user;
                },
                getNameComplete: function () {
                    if (this.hasUser()) {
                        return user.first_name + " " + user.last_name;
                    } else {
                        return 'menu';
                    }
                },
                hasToken: function () {
                    return accessToken.auth_token;
                },
                getAuthToken: function () {
                    return accessToken.auth_token;
                },
                save: function (objUser) {
                    this.update(objUser);
                },
                getDirecciones: function(){
                    return user.directions || [];
                },
                setDirecciones: function(direcciones){
                    user.direcciones = direcciones;
                    window.localStorage.setItem('user', JSON.stringify(user));
                },
                getPedidosPeriodicos: function() {
                    return user.schedules_orders || [];
                },
                setPedidosPeriodicos: function(pedidos){
                    user.schedules_orders = pedidos;
                    window.localStorage.setItem('user', JSON.stringify(user));
                }
            }
        })
        .factory('Direcciones', function ($http, $timeout, $q, User, URL_BASE, API_PATH) {
            var direcciones = [];
            var peticionDirecciones = false;
            var token = User.getAuthToken();
            //direcciones = JSON.parse(window.localStorage['direcciones'] || '[]');
            direcciones = User.getDirecciones();
            var get_direcciones = function () {
                if (!peticionDirecciones) {
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.direcciones,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                                .success(function (data) {
                                    direcciones = data;
                                    User.setDirecciones(direcciones);
                                    peticionDirecciones = true;
                                    resolve(direcciones);
                                })
                                .error(function (err) {
                                    reject(err);
                                });
                    });
                } else {
                    return $q(function (resolve, reject) {
                        resolve(direcciones);
                    });
                }
            };
            var get_data_postal_code = function (postal_code) {
                var configHttp = {
                    method: "GET",
                    url: "https://api-codigos-postales.herokuapp.com/codigo_postal/"+(postal_code.length==4?"0"+postal_code:postal_code),
                    headers: {
                        "Content-Type": "application/json"
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                        .success(function (data) {
                           resolve(data);
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            };
            var post_direccion = function (direccion) {
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + API_PATH.direcciones,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    },
                    data: {
                        "location": direccion.location,
                        "street": direccion.street,
                        "interior_number": direccion.interior_number,
                        "exterior_number": direccion.exterior_number,
                        "postal_code": direccion.postal_code,
                        "colony": direccion.colony,
                        "delegation_municipaly": direccion.delegation_municipaly,
                        "lat": direccion.lat,
                        "lng": direccion.lng
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                direcciones.push(data);
                                User.setDirecciones(direcciones);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };
            var put_direccion = function (indice, direccion) {
                var configHttp = {
                    method: "PUT",
                    url: URL_BASE.urlBase + API_PATH.direcciones  + direccion.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    },
                    data: {
                        "location": direccion.location,
                        "street": direccion.street,
                        "interior_number": direccion.interior_number,
                        "exterior_number": direccion.exterior_number,
                        "postal_code": direccion.postal_code,
                        "colony": direccion.colony,
                        "delegation_municipaly": direccion.delegation_municipaly,
                        "lat": direccion.lat,
                        "lng": direccion.lng
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                direcciones[indice] = data;
                                User.setDirecciones(direcciones);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };
            var delete_direccion = function (direccion) {
                var configHttp = {
                    method: "DELETE",
                    url: URL_BASE.urlBase + API_PATH.direcciones  + direccion.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                direcciones.splice(direcciones.indexOf(direccion), 1);
                                User.setDirecciones(direcciones);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };
            var get_direccion_base = function () {
                return  {
                    "location": "Mexico DF",
                    "street": "",
                    "interior_number": "",
                    "exterior_number": "",
                    "postal_code": "",
                    "colony": "",
                    "delegation_municipaly": "",
                    lat: "",
                    lng: ""
                };
            };
            return {
                getDirecciones: get_direcciones,
                addDireccion: post_direccion,
                updateDireccion: put_direccion,
                deleteDireccion: delete_direccion,
                getDireccionVacia: get_direccion_base,
                getDataPostalCode: get_data_postal_code
            };
        })
        .factory('Pedidos', function ($http, $timeout, $q, User, URL_BASE, API_PATH) {
            var token = User.getAuthToken();
            return {
                getPedidos: function () {
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.ventas,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                }
            };
        })
        .factory('Preguntas', function ($http, $timeout, $q, User ,URL_BASE, API_PATH) {
            var token = User.getAuthToken();
            var preguntas = [];
            var peticionPreguntas = false;
            var get_preguntas = function () {
                if (!peticionPreguntas) {
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.preguntas,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                preguntas = data;
                                window.localStorage.setItem('preguntas', JSON.stringify(preguntas));
                                peticionPreguntas = true;
                                resolve(preguntas);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                } else {
                    return $q(function (resolve, reject) {
                        if (preguntas.length > 0) {
                            resolve(preguntas);
                        } else {
                            reject([]);
                        }
                    });
                }
            };
            return {
                getPreguntas: get_preguntas
            };

        })
        .factory('Categorias', function ($http, $timeout, $q, URL_BASE, API_PATH, User ) {
            var token = User.getAuthToken();
            var categorias = [];
            var peticionCategorias = false;
            var get_categorias = function () {
                if (!peticionCategorias) {
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.categorias,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        }
                    };
                    console.log(configHttp);
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                categorias = data;
                                window.localStorage.setItem('categorias', JSON.stringify(categorias));
                                peticionCategorias = true;
                                resolve(categorias);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                } else {
                    return $q(function (resolve, reject) {
                        if (categorias.length > 0) {
                            resolve(categorias);
                        } else {
                            reject([]);
                        }
                    });
                }
            };
            var get_categoria = function(id){
                if (!peticionCategorias) {
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.categorias  + id + "/",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                } else {
                    return $q(function (resolve, reject) {
                        var categoria = {};
                        if (categorias.length > 0) {
                            for(var cont= 0; cont < categorias.length; cont++){
                                if(categorias[cont].id == id){
                                    categoria = categorias[cont];
                                    break;
                                }
                            }
                            resolve(categoria);
                        } else {
                            reject([]);
                        }
                    });
                }
            };

            return {
                getCategorias: get_categorias,
                getCategoria: get_categoria
            };
        })
        .factory('Productos', function ($http, $timeout, $q, URL_BASE, API_PATH, User ) {
            var token = User.getAuthToken();
            var productos = [];
            var get_productos = function (categoriaId) {
                var configHttp = {
                    method: "GET",
                    url: URL_BASE.urlBase + API_PATH.productos,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    },
                    params: { category: categoriaId }
                };
                console.log(configHttp);
                return $q(function (resolve, reject) {
                    $http(configHttp)
                        .success(function (data) {
                            productos = data;
                            resolve(productos);
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            };
            var get_producto = function(productoId){
                var configHttp = {
                    method: "GET",
                    url: URL_BASE.urlBase + API_PATH.productos +  productoId + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                        .success(function (data) {
                            resolve(data);
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            };

            return {
                getProductos: get_productos,
                getProducto: get_producto
            };
        })
        .factory('Descuentos', function(){
            return {
                calcularDescuento: function(producto){
                    var price = 0.0;
                    var descuento = 0.0;
                    var enteros = 0;
                    var fracciones = 0;
                    var conDescuento = 0.0;
                    var sinDescuento = 0.0;
                    if(producto.discount && producto.discount.type){
                        if(producto.discount.type == "precio"){
                            price = producto.discount.price;
                            descuento = (producto.price * producto.quantity ) - ( producto.quantity * price);
                        }else if (producto.discount.type == "porcentaje"){
                            price = (producto.price * (1.00 - ( producto.discount.percentage / 100)));
                            descuento = (producto.price * producto.quantity ) - (producto.quantity * price);
                        }else if(producto.discount.type == "cantidad"){
                            enteros = producto.quantity % producto.discount.quantity;
                            fracciones = producto.quantity - enteros;
                            if(producto.discount.price > 0){
                                conDescuento = (enteros * producto.discount.price);
                                sinDescuento = (fracciones * producto.price);
                                descuento = (producto.price * producto.quantity ) - (conDescuento + sinDescuento)
                            }else{
                                price = (producto.price * (1.00 - (producto.discount.percentage / 100.00)))
                                conDescuento = (enteros * price);
                                sinDescuento = (fracciones * producto.price);
                                descuento = (producto.price * producto.quantity ) -(conDescuento + sinDescuento)
                            }
                        }
                    }
                    return descuento;
                }
            };
        })
        .factory('Buscador', function($q, $http, User, Productos, URL_BASE, API_PATH){
            var token = User.getAuthToken();
            var query = "";
            query = JSON.parse(window.localStorage['query'] || '{}');
            return {
                setQuery: function(q){
                    query = q;
                    window.localStorage.setItem('query', JSON.stringify(query));
                },
                getQuery: function(){
                    return query;
                },
                getProductos: function(){
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.productos ,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        },
                        params: { q: query.producto }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (productos) {
                                resolve(productos);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                }
            };
        })
        .factory('Carrito', function ($q, $http, User, Direcciones, Descuentos, ImageService, FileService ,
                                      URL_BASE, AUTH_PATH, API_PATH) {
            var productos = [];
            var direccion = {};
            var tarjeta = {};
            var total = 0.0;
            var venta = {};
            var images = FileService.images;
            var token = User.getAuthToken();
            productos = JSON.parse(window.localStorage['carrito'] || '[]');
            direccion = JSON.parse(window.localStorage['direccion'] || '{}');
            tarjeta = JSON.parse(window.localStorage['tarjeta'] || '{}');
            venta = JSON.parse(window.localStorage['venta'] || '{}');
            function sumarTotal() {
                total = 0;
                for (var cont = 0; cont <= productos.length - 1; cont++) {
                    total += productos[cont].price * productos[cont].quantity;
                }
            };
            function crear_user_conekta(){
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + AUTH_PATH.register_user_conekta ,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    },
                    data: { conektaTokenId: tarjeta.token.id }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                        .success(function (ok) {
                            resolve(ok);
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            };
            return {
                getProductos: function () {
                    return productos;
                },
                getCountProductos: function(){
                    return productos.length;
                },
                addProducto: function (item) {
                    var encontrado = false;
                    for(var i = 0; i < productos.length; i++){
                        if(productos[i].id == item.id){
                            encontrado = true;
                            productos[i].quantity += item.quantity;
                            break;
                        }
                    }
                    if(!encontrado){
                        productos.push(item);
                    }
                    window.localStorage.setItem('carrito', JSON.stringify(productos));
                    sumarTotal();
                    return true;
                },
                removeProducto: function (producto) {
                    productos.splice(productos.indexOf(producto), 1);
                    window.localStorage.setItem('carrito', JSON.stringify(productos));
                    sumarTotal();
                    return productos;
                },
                setDireccion: function(dir){
                    direccion = dir;
                    window.localStorage.setItem('direccion', JSON.stringify(direccion));
                },
                getDireccion: function(){
                    if(direccion.street){
                        return direccion;
                    }else{
                        return Direcciones.getDireccionVacia();
                    }
                },
                setTarjeta: function(tarj){
                    tarjeta = tarj;
                    window.localStorage.setItem('tarjeta', JSON.stringify(tarjeta));
                    crear_user_conekta();
                },
                getTarjeta: function(){
                    if(tarjeta.name){
                        return tarjeta;
                    }else{
                        return {
                            "card": {
                                "number": "4242424242424242",
                                "name": "Ricardo Alcantara G.",
                                "exp_year": "2015",
                                "exp_month": "12",
                                "cvc": "123"
                            }
                        };
                    }
                },
                getTotal: function(){
                    if(productos.length > 0 && total==0){
                        sumarTotal();
                    }
                    return total;
                },
                getTotales: function(){
                    var totales = {
                        subtotal: 0.0,
                        descuento: 0.0,
                        total: 0.0
                    };

                    for (var cont = 0; cont <= productos.length - 1; cont++) {
                        totales.subtotal += productos[cont].price * productos[cont].quantity;
                        totales.descuento += Descuentos.calcularDescuento(productos[cont]);
                    }

                    totales.total = totales.subtotal - totales.descuento;

                    return totales;

                },
                getVenta: function(){
                  venta = JSON.parse(window.localStorage['venta'] || '{}');
                  return venta;
                },
                enviarPedido: function(){
                    var configHttp = {
                        method: "POST",
                        url: URL_BASE.urlBase + API_PATH.ventas ,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        },
                        data: { direction: direccion.id, status: 0, scheduled_order: false, delivered: false }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (vta) {
                                venta = vta;
                                window.localStorage.setItem('venta', JSON.stringify(venta));
                                resolve(venta);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                },
                cerrarPedido: function(){
                    var configHttp = {
                        method: "PATCH",
                        url: URL_BASE.urlBase + API_PATH.ventas + venta.id + "/",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        },
                        data: {  status: 1 }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                venta.status = 1;
                                window.localStorage.setItem('venta', JSON.stringify(venta));
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                },
                enviarDetalleVentas: function(indice){
                    venta = this.getVenta();
                    var configHttp = {
                        method: "POST",
                        url: URL_BASE.urlBase + API_PATH.detalle_ventas ,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        },
                        data: { sale: venta.id, product: productos[indice].id, quantity: productos[indice].quantity }
                    };
                    console.log(configHttp);
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                },
                enviarImagenes: function(){
                    venta = this.getVenta();
                    var dataJson = [];
                    for(var cont=0; cont<images.length; cont++){
                        var urlImage = FileService.getUrlForImage(images[cont]);
                        var image = { sale: venta.id, image_recipe: urlImage };
                        dataJson.push(image);
                    }
                    console.log(dataJson);
                    var configHttp = {
                        method: "POST",
                        url: URL_BASE.urlBase + API_PATH.images_ventas ,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        },
                        data: { sale: venta.id, image_recipe: urlImage }
                    };
                    console.log(configHttp);
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                resolve(data);
                            }).error(function (err) {
                                reject(err);
                            });
                    });
                },
                empty: function(){
                    // limpiar los datos del carrito.
                    tarjeta = {};
                    direccion = {};
                    productos = [];
                    venta = {};
                    window.localStorage.setItem('tarjeta', JSON.stringify(tarjeta));
                    window.localStorage.setItem('direccion', JSON.stringify(direccion));
                    window.localStorage.setItem('carrito', JSON.stringify(productos));
                    window.localStorage.setItem('venta', JSON.stringify(venta));
                    FileService.empty();
                }
            };
        })
        .factory('PedidosPeriodicos', function ($q, $http, $ionicPopup, User, URL_BASE, API_PATH) {
            var pedidos = [];
            var token = User.getAuthToken();
            var peticionPedidos = true;
            //pedidos = JSON.parse(window.localStorage['periodicos'] || '[]');
            pedidos = User.getPedidosPeriodicos();
            function get_pedidos_periodicos(){
                if (!peticionPedidos) {
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.usuarios,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + token
                        }
                    };
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                            .success(function (data) {
                                pedidos = data.schedules_orders;
                                resolve(pedidos);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                } else {
                    return $q(function (resolve, reject) {
                        resolve(pedidos);
                    });
                }
            };
            function add_pedido_periodico(producto){
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + API_PATH.pedidos_periodicos ,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    },
                    data: {
                        product: producto.id,
                        quantity: producto.quantity,
                        period: producto.periodico.period,
                        days: producto.periodico.days,
                        times: producto.periodico.times
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                        .success(function (pedido) {
                            resolve(pedido);
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            };
            function update_pedido_periodico(pedido){
                var configHttp = {
                    method: "PUT",
                    url: URL_BASE.urlBase + API_PATH.pedidos_periodicos + pedido.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    },
                    data: {
                        product: pedido.product.id,
                        quantity: pedido.quantity,
                        period: pedido.period,
                        days: pedido.days,
                        times: pedido.times
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                        .success(function (pedido) {
                            resolve(pedido);
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            };

            function delete_pedido_periodico(pedido){
                var configHttp = {
                    method: "DELETE",
                    url: URL_BASE.urlBase + API_PATH.pedidos_periodicos + pedido.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + token
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                        .success(function (confirmado) {
                            resolve(confirmado);
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            };

            return {
                getPedidos: get_pedidos_periodicos,
                getCountPedidos: function(){
                    return pedidos.length;
                },
                addPedido: function (producto) {
                    var encontrado = false;
                    for (var i = 0; i < pedidos.length; i++) {
                        if (pedidos[i].product.id == producto.id) {
                            $ionicPopup.alert({
                                title: 'Producto no agregado!',
                                template: 'El producto ya existe en los pedidos periodicos'
                            });
                            encontrado = true;
                            break;
                        }
                    }
                    if (!encontrado) {
                        return $q(function(resolve, reject){
                            add_pedido_periodico(producto).then(function (pedido) {
                                delete producto.periodico;
                                pedido.product = producto;
                                pedidos.push(pedido);
                                User.setPedidosPeriodicos(pedidos);
                                resolve(pedido)
                            }, function (err) {
                                $ionicPopup.alert({
                                    title: 'Pedido periodico no agregado!',
                                    template: err.detail
                                });
                                reject(err);
                            });
                        });
                    }
                    return !encontrado;
                },
                editPedido: function(pedido){
                    return $q(function(resolve, reject){
                        update_pedido_periodico(pedido).then(function(data){
                            User.setPedidosPeriodicos(pedidos);
                            resolve(data);
                        },function(err){
                            $ionicPopup.alert({
                                title: 'Pedido periodico no agregado!',
                                template: err.detail
                            });
                            reject(err);
                        });
                    });
                },
                removePedido: function (pedido) {
                    return $q(function(resolve, reject){
                        delete_pedido_periodico(pedido).then(function (confirmado) {
                            pedidos.splice(pedidos.indexOf(pedido), 1);
                            User.setPedidosPeriodicos(pedidos);
                            resolve(pedidos);
                        }, function (err) {
                            $ionicPopup.alert({
                                title: 'Pedido periodico no agregado!',
                                template: err.detail
                            });
                            reject(err);
                        });
                    });
                },
                getPedidoPeriodicoVacio: function () {
                    return {
                        pedido: false,
                        period: 'por dia',
                        days: 1,
                        times: 1
                    };
                },
                configurarProducto: function(producto){
                    var encontrado = false;
                    for (var i = 0; i < pedidos.length; i++) {
                        if (pedidos[i].product && pedidos[i].product.id == producto.id) {
                            producto.periodico = this.getPedidoPeriodicoVacio();
                            producto.periodico.pedido = true;
                            producto.periodico.period = pedidos[i].period;
                            producto.periodico.days = pedidos[i].days;
                            producto.periodico.times = pedidos[i].times;
                            producto.periodico.date_next = pedidos[i].date_next;
                            encontrado = true;
                            break;
                        }
                    }
                    if(!encontrado){
                        producto.periodico = this.getPedidoPeriodicoVacio();
                    }
                    return producto;
                }
            };
        })
        .factory('UIConekta',function($q, Carrito ){
            var get_tarjeta_token = function(tarjeta){
                console.log(tarjeta);
              return $q(function(resolve, reject){
                  Conekta.token.create(tarjeta, function(token){
                      console.log(token);
                      tarjeta.token = token;
                      Carrito.setTarjeta(tarjeta);
                      resolve(token);
                  }, function(err) {
                      reject(err);
                  });
              });
            };
            return {
                getTarjetaToken: get_tarjeta_token
            };
        })
        ;