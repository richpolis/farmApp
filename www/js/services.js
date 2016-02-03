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
        .factory('FileService', function($cordovaFile, $ionicPopup) {
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
                removeImage: function(image){
                    var imagenes = this.images();
                    var indexImage = imagenes.indexOf(image);
                    var name = imagenes[indexImage].substr(imagenes[indexImage].lastIndexOf('/') + 1);
                        $cordovaFile.removeFile(cordova.file.dataDirectory, name)
                                .then(function (success) {
                                    $ionicPopup.alert({
                                        title: 'Receta',
                                        template: 'Archivo eliminado'
                                    });
                                }, function (error) {
                                    $ionicPopup.alert({
                                        title: 'Receta',
                                        template: 'No es posible eliminar el archivo'
                                    });
                                });
                    imagenes.splice(indexImage,1);
                    window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(imagenes));
                },
                empty: function(){
                    var imagenes = this.images();
                    for(var cont=0; cont<imagenes.length; cont++){
                        var name = imagenes[cont].substr(imagenes[cont].lastIndexOf('/') + 1);
                        $cordovaFile.removeFile(cordova.file.dataDirectory, name)
                                .then(function (success) {
                                    console.log("Archivo eliminado");
                                }, function (error) {
                                    console.log("No es posible eliminar el archivo");
                                });
                    }
                    images=[];
                    window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
                }
            }
        })
        .factory('ImageService', function($cordovaCamera, FileService, $q, $cordovaFile, URL_BASE, API_PATH, Loader) {

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
                options.fileKey = "receta";
                options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1);
                options.mimeType = "image/" + imageURI.substr(imageURI.lastIndexOf('.')+1);
                options.params = params;
                options.httpMethod = "POST";
                options.headers = headers;
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
                    Loader.showLoading("Cargando imagenes de receta");
                    for (var i = 0; i < images.length; i++) {
                        Loader.showLoading("Cargando " + i + "/" + images.length);
                        var image = images[i];
                        var urlImage = FileService.getUrlForImage(image);
                        ft.upload(urlImage,
                            encodeURI(URL_BASE.urlBase + API_PATH.images_ventas),
                            savedFile(image, onSuccess), onError, getImageUploadOptions(urlImage, params, headers));
                    }
                    Loader.hideLoading();
                }
            }
        })
        .factory('User', function ($http, $timeout, $q, URL_BASE, AUTH_PATH, API_PATH) {
            var accessToken;
            var user;
            var tokenPhone;
            user = JSON.parse(window.localStorage['user'] || '{}');
            accessToken = JSON.parse(window.localStorage['access_token'] || '{}');
            tokenPhone = JSON.parse(window.localStorage['token_phone'] || '{}');
            function request(args) {
                // Let's retrieve the token from the cookie, if available
                if(accessToken.auth_token){
                    $http.defaults.headers.common.Authorization = 'Token ' + accessToken.auth_token;
                }
                // Continue
                var params = args.params || {};
                var args = args || {};
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
            
            function delete_reminder(reminder) {
                var configHttp = {
                    method: "DELETE",
                    url: URL_BASE.urlBase + AUTH_PATH.recordatorios + reminder.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var recordatorios = this.getRecordatorios();
                                var indexReminder = recordatorios.indexOf(reminder);
                                recordatorios.splice(indexReminder,1);
                                this.setRecordatorios(recordatorios);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };
            function post_reminder(reminder) {
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + AUTH_PATH.recordatorios ,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    },
                    data: {"message": reminder.message, "time": reminder.time, "monday": reminder.moday,
                    "tuesday":reminder.tuesday, "wednesday":reminder.wednesday, "thursday":reminder.thursday,
                    "friday": reminder.friday, "saturday": reminder.saturday, "sunday": reminder.sunday}
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var recordatorios = this.getRecordatorios();
                                recordatorios.push(data);
                                this.setRecordatorios(recordatorios);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };
            
            function update_reminder(reminder) {
                var configHttp = {
                    method: "PUT",
                    url: URL_BASE.urlBase + AUTH_PATH.recordatorios + reminder.id + "/" ,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    },
                    data: {"message": reminder.message, "time": reminder.time, "monday": reminder.moday,
                    "tuesday":reminder.tuesday, "wednesday":reminder.wednesday, "thursday":reminder.thursday,
                    "friday": reminder.friday, "saturday": reminder.saturday, "sunday": reminder.sunday}
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var recordatorios = this.getRecordatorios();
                                for(var cont=0; cont<recordatorios.length;cont++){
                                    if(recordatorios[cont].id==reminder.id){
                                        recordatorios[cont] = reminder;
                                    }
                                }
                                this.setRecordatorios(recordatorios);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };
            
            function delete_card(card) {
                var configHttp = {
                    method: "DELETE",
                    url: URL_BASE.urlBase + AUTH_PATH.tarjetas + card.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var tarjetas = this.getTarjetas();
                                var indexCard = tarjetas.indexOf(card);
                                tarjetas.splice(indexCard,1);
                                this.setTarjetas(tarjetas);
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
                        "cell": objUser.cell,
                        "inapam": objUser.inapam
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
                        "cell": objUser.cell,
                        "inapam": objUser.inapam
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
                getTarjetas: function(){
                    return user.cards || [];
                },
                setTarjetas: function(tarjetas){
                    user.cards = tarjetas;
                    window.localStorage.setItem('user', JSON.stringify(user));
                },
                borrarTarjeta: delete_card,
                getPedidosPeriodicos: function() {
                    return user.schedules_orders || [];
                },
                setPedidosPeriodicos: function(pedidos){
                    user.schedules_orders = pedidos;
                    window.localStorage.setItem('user', JSON.stringify(user));
                },
                guardarRecordatorio: post_reminder,
                getRecordatorios: function(){
                    return user.reminders || [];
                },
                setRecordatorios: function(reminders){
                    user.reminders = reminders;
                    window.localStorage.setItem('user', JSON.stringify(user));
                },
                updateRecordatorio: update_reminder,
                deleteRecordatorio: delete_reminder,
                enviarCalificacion: function(ranking){
                    var configHttp = {
                        method: "POST",
                        url: URL_BASE.urlBase + API_PATH.ratings,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + accessToken.auth_token
                        },
                        data: {"user": user.id, "rating": ranking.calificacion,
                        "comment": ranking.comentario }
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
                hasTokenPhone: function(){
                    var tokenPhone = this.getTokenPhone();
                    return tokenPhone.id != 0;
                },
                tokenPhoneIsEqual: function(){
                    this.getUser();
                    var token = this.getTokenPhone();
                    if(tokenPhone.token && tokenPhone.token == token.token){
                        return true;
                    }else{
                        return false;
                    }
                },
                getTokenPhone: function () {
                    if(user.token_phone.length && user.token_phone.length > 0){
                        return user.token_phone[0];
                    }else{
                        return {id: 0, token:''};
                    }
                },
                addTokenPhone: function (token) {
                    var configHttp = {
                        method: "POST",
                        url: URL_BASE.urlBase + API_PATH.tokens_phone,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + accessToken.auth_token
                        },
                        data: {"token": token}
                    };
                    console.log(configHttp);
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                                .success(function (data) {
                                    user.token_phone.push(data);
                                    tokenPhone = data;
                                    window.localStorage.setItem('user', JSON.stringify(user));
                                    window.localStorage.setItem('token_phone', JSON.stringify(tokenPhone));
                                    resolve(data);
                                })
                                .error(function (err) {
                                    reject(err);
                                });
                    });
                },
                updateTokenPhone: function(token){
                    var tokenPhone = this.getTokenPhone();
                    var configHttp = {
                        method: "PUT",
                        url: URL_BASE.urlBase + API_PATH.tokens_phone + tokenPhone.id + "/",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + accessToken.auth_token
                        },
                        data: {"token": token}
                    };
                    console.log(configHttp);
                    return $q(function (resolve, reject) {
                        $http(configHttp)
                                .success(function (data) {
                                    user.token_phone[0] = data;
                                    tokenPhone = data;
                                    window.localStorage.setItem('user', JSON.stringify(user));
                                    window.localStorage.setItem('token_phone', JSON.stringify(tokenPhone));
                                    resolve(data);
                                })
                                .error(function (err) {
                                    reject(err);
                                });
                    });
                }
            }
        })
        .factory('Direcciones', function ($http, $timeout, $q, User, URL_BASE, API_PATH) {
            var direcciones = [];
            var peticionDirecciones = false;
            //direcciones = JSON.parse(window.localStorage['direcciones'] || '[]');
            direcciones = User.getDirecciones();
            var get_direcciones = function () {
                if (!peticionDirecciones) {
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.direcciones,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Token " + User.getAuthToken()
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
                        "Authorization": "Token " + User.getAuthToken()
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
                        "lng": direccion.lng,
                        "active": direccion.active
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
                        "Authorization": "Token " + User.getAuthToken()
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
                        "lng": direccion.lng,
                        "active": direccion.active
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
                        "Authorization": "Token " + User.getAuthToken()
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
                    "id": 0,
                    "location": "Mexico DF",
                    "street": "",
                    "interior_number": "",
                    "exterior_number": "",
                    "postal_code": "",
                    "colony": "",
                    "delegation_municipaly": "",
                    lat: "",
                    lng: "",
                    "active": true
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
                            "Authorization": "Token " + User.getAuthToken()
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
                            "Authorization": "Token " + User.getAuthToken()
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
                            "Authorization": "Token " + User.getAuthToken()
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
                            "Authorization": "Token " + User.getAuthToken()
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
                        "Authorization": "Token " + User.getAuthToken()
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
                        "Authorization": "Token " + User.getAuthToken()
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
                calcularIva: function(producto, subt, desc){
                    if(producto.with_tax){
                        var total = subt - desc;
                        return total * 0.16;
                    }else{
                        return 0.0;
                    }
                },
                calcularDescuento: function(producto){
                    var price = 0.0;
                    var descuento = 0.0;
                    var enteros = 0;
                    var fracciones = 0;
                    var conDescuento = 0.0;
                    var sinDescuento = 0.0;
                    if(producto.discount && producto.discount.active_discount){
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
                            "Authorization": "Token " + User.getAuthToken()
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

            function crear_user_conekta(tokenConekta){
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + AUTH_PATH.register_user_conekta ,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + User.getAuthToken()
                    },
                    data: { conektaTokenId: tokenConekta.id }
                };
                console.log("Token de Conekta: " + JSON.stringify(tokenConekta));
                return $q(function (resolve, reject) {
                    $http(configHttp)
                        .success(function (data) {
                            console.log("Data: " )
                            console.log(data);
                            tarjeta = data.card;
                            if(!data.error){
                                var tarjetas = User.getTarjetas();
                                tarjetas.push(tarjeta);
                                User.setTarjetas(tarjetas);
                            }
                            resolve(data);
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
                setNotas: function(notas){
                   venta = this.getVenta();
                   venta.notes = notas;
                   window.localStorage.setItem('venta', JSON.stringify(venta));
                },
                setTarjeta: function(tarj){
                    tarjeta = tarj;
                    window.localStorage.setItem('tarjeta', JSON.stringify(tarjeta));
                },
                createCardConekta: function(tokenConekta){
                    return crear_user_conekta(tokenConekta);
                },
                getTarjeta: function(){
                    if(tarjeta.id){
                        return tarjeta;
                    }else{
                        return null;
                    }
                },
                getTarjetaVacia: function () {
                    return {
                        "card": {
                            "number": "",
                            "name": "",
                            "exp_year": "",
                            "exp_month": "",
                            "cvc": ""
                        }
                    };
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
                        iva: 0.0,
                        total: 0.0
                    };
                    var subT = 0.0, desc = 0.0;
                    for (var cont = 0; cont <= productos.length - 1; cont++) {
                        subT = productos[cont].price * productos[cont].quantity;
                        desc = Descuentos.calcularDescuento(productos[cont]);
                        totales.subtotal += subT;
                        totales.descuento += desc;
                        totales.iva += Descuentos.calcularIva(productos[cont],subT, desc);
                    }

                    totales.total = totales.subtotal - totales.descuento + totales.iva;

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
                            "Authorization": "Token " + User.getAuthToken()
                        },
                        data: { direction: direccion.id, status: 0, scheduled_order: false,
                                delivered: false, notes: venta.notes, card_conekta: tarjeta.id }
                    };
                    console.log(configHttp);
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
                            "Authorization": "Token " + User.getAuthToken()
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
                            "Authorization": "Token " + User.getAuthToken()
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
                            "Authorization": "Token " + User.getAuthToken()
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
                hasProductsWithRecipe: function(index){
                    var encontrado = false;
                    for (var cont = 0; cont < productos.length; cont++) {
                        if (productos[cont].recipe > index ) {
                            encontrado = true;
                            break;
                        }
                    }
                    return encontrado;
                },
                empty: function(){
                    // limpiar los datos del carrito.
                    direccion = {};
                    productos = [];
                    venta = {};
                    window.localStorage.setItem('direccion', JSON.stringify(direccion));
                    window.localStorage.setItem('carrito', JSON.stringify(productos));
                    window.localStorage.setItem('tarjeta', JSON.stringify(tarjeta));
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
                            "Authorization": "Token " + User.getAuthToken()
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
                        "Authorization": "Token " + User.getAuthToken()
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
                        "Authorization": "Token " + User.getAuthToken()
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
                        "Authorization": "Token " + User.getAuthToken()
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
                      Carrito.createCardConekta(token).then(function(data){
                        resolve(data);
                      },function(err){
                        reject(err);
                      });

                  }, function(err) {
                      reject(err);
                  });
              });
            };
            var validar_tarjeta = function(tarjeta){
                return Conekta.card.validateNumber(tarjeta.card.number);
            };
            var validar_fecha_expiracion = function(tarjeta){
                var exp_month = tarjeta.card.exp_month || tarjeta.exp_month;
                var exp_year = tarjeta.card.exp_year || tarjeta.exp_year;
                return Conekta.card.validateExpirationDate(exp_month, exp_year);
            };
            var validar_cvc = function(tarjeta){
                return Conekta.card.validateCVC(tarjeta.card.cvc);
            };
            return {
                getTarjetaToken: get_tarjeta_token,
                validarTarjeta: validar_tarjeta,
                validarFechaExpiracion: validar_fecha_expiracion,
                validarCvc: validar_cvc
                
            };
        })
        .factory('Contacto',function($q, $http, URL_BASE, API_PATH){
            var enviar_contacto = function(object) {
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + API_PATH.contacto,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: {
                        "name": object.name,
                        "email": object.email,
                        "phone": object.phone,
                        "subject": object.subject,
                        "message": object.message
                    }
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
            };
            return {
              contacto:enviar_contacto
            };
        })
        .factory('RecuperarPassword',function($q, $http, URL_BASE, API_PATH){
            var recuperar_password = function(object) {
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + API_PATH.recover_password,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: {"email": object.email}
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
            };
            return {
              recuperarPassword:recuperar_password
            };
        })
        .factory('Recordatorios',function(User){
            var find_recordatorio = function(recordatorioId){
                var obj = null;
                var recordatorios = User.getRecordatorios();
                for(var i = 0; i<=recordatorios.length; i++){
                    if(recordatorios[i].id == recordatorioId){
                        obj = recordatorios[i];
                        break;
                    }
                }
                return obj;
            };

            var add_recordatorio = function(recordatorio) {
                //recordatorio.time = get_time();
                User.guardarRecordatorio(recordatorio);
            };
            
            var update_recordatorio = function(recordatorio){
                User.updateRecordatorio(recordatorio);
            }

            var get_recordatorios = function(){
                var recordatorios = User.getRecordatorios();
                for(var cont=0; cont<recordatorios.length; cont++){
                    recordatorios[cont].allDays = all_days(recordatorios[cont]);
                    recordatorios[cont].weekend = only_weekend(recordatorios[cont]);
                    recordatorios[cont].monday_to_friday = only_monday_to_friday(recordatorios[cont]);
                    recordatorios[cont].leyend = getIntervaloString(recordatorios[cont]);
                    recordatorios[cont].tiempo = get_tiempo(recordatorios[cont]);
                }
                return recordatorios;
            };
            
            var delete_recordatorio = function(recordatorio){
                User.deleteRecordatorio(recordatorio);
            }

            var get_recordatorio_vacia = function(){
                var date = new Date();
                var recordatorio =  {
                    time: '00:00:00',
                    tiempo: {
                        "hora":"00",
                        "minutos": "00",
                        "horario": 'am'
                    },
                    message: "",
                    monday: false,
                    tuesday: false,
                    wednesday: false,
                    thursday: false,
                    friday: false,
                    saturday: false,
                    sunday: false,
                    allDays: false,
                    weekend: false
                };
            };

            function getIntervaloString(recordatorio){
                var cadena = "";
                
                if(recordatorio.allDays){
                    return "Todos los dias";
                }
                if(recordatorio.weekend){
                    return "Fines de semana";
                }
                if(recordatorio.monday_to_friday){
                    return "Lunes a Viernes";
                }

                if(recordatorio.monday){
                    cadena += "Lunes ";
                }
                if(recordatorio.tuesday){
                    cadena += "Martes ";
                }
                if(recordatorio.wednesday){
                    cadena += "Miercoles ";
                }
                if(recordatorio.thursday){
                    cadena += "Jueves ";
                }
                if(recordatorio.friday){
                    cadena += "Viernes ";
                }
                if(recordatorio.saturday){
                    cadena += "Sabado ";
                }
                if(recordatorio.sunday){
                    cadena += "Domingo ";
                }
                return cadena;
            }
            
            function get_tiempo(recordatorio){
                var arreglo = recordatorio.time.split(":");
                var tiempo = {
                    "hora": "00",
                    "minutos": "00",
                    "horario": 'am'
                };
                var hora = (parseInt(arreglo[0])>12)?parseInt(arreglo[0])-12:parseInt(arreglo[0]);
                var minutos = parseInt(arreglo[1]);
                var horario = (parseInt(arreglo[0])>12)?'pm':'am';
                tiempo.hora = ((hora<10)?"0"+hora:hora);
                tiempo.minutos = ((minutos<10)?"0"+minutos:minutos);
                tiempo.horario = horario;
                return tiempo;
                
            }
            
            function get_time(recordatorio){
                var hora = parseInt(recordatorio.tiempo.hora);
                var minutos = parseInt(recordatorio.tiempo.minutos);
                var horario = recordatorio.tiempo.horario;
                if(horario == "pm"){
                    hora += 12;
                    if(hora==24)
                        hora = 0;
                }
                return ((hora<10)?"0"+hora:hora) + ":" + ((minutos<10)?"0"+minutos:minutos) + ":00";
            }
            
            function all_days(n){
                return (n.monday && n.thuesday && n.wednesday && n.thursday && n.friday && n.saturday && n.sunday);
            }
            
            function only_weekend(n){
                return (!n.monday && !n.thuesday && !n.wednesday && !n.thursday && !n.friday && n.saturday && n.sunday);
            }

            function only_monday_to_friday(n){
                return (n.monday && n.thuesday && n.wednesday && n.thursday && n.friday && !n.saturday && !n.sunday);
            }

            return {
                add: add_recordatorio,
                update: update_recordatorio,
                get: get_recordatorios,
                find: find_recordatorio,
                delete: delete_recordatorio,
                getEmpty: get_recordatorio_vacia
            };
        })
        ;
