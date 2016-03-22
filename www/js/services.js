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
        .factory('FileService', function($cordovaFile, $q) {
            var images;
            var RECIPE_STORAGE_KEY = 'recetas';
            var INAPAM_STORAGE_KEY = 'inapams';
            var STORAGE_KEY = '';

            return {
                RECIPE_STORAGE_KEY: RECIPE_STORAGE_KEY,
                INAPAM_STORAGE_KEY: INAPAM_STORAGE_KEY,
                STORAGE_KEY: STORAGE_KEY,
                storeImage: function(img, storageKey) {
                    this.STORAGE_KEY = storageKey || STORAGE_KEY;
                    images.push(img);
                    window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(images));
                },
                images: function(storageKey) {
                    storageKey = storageKey || this.STORAGE_KEY;
                    var img = window.localStorage.getItem(storageKey);
                    if (img) {
                        images = JSON.parse(img);
                    } else {
                        images = [];
                    }
                    return images;
                },
                recepies: function(){
                    return this.images(this.RECIPE_STORAGE_KEY);
                },
                inapams: function(){
                    return this.images(this.INAPAM_STORAGE_KEY);
                },
                getUrlForImage: function(imageName) {
                    var trueOrigin = cordova.file.dataDirectory + imageName;
                    return trueOrigin;
                },
                removeImage: function (image, storageKey) {
                    var self = this;
                    return $q(function(resolve, reject){
                        console.log("Remove Image: " + storageKey);
                        var imagenes = self.images(storageKey);
                        var indexImage = imagenes.indexOf(image);
                        var name = imagenes[indexImage].substr(imagenes[indexImage].lastIndexOf('/') + 1);
                        console.log(self.getUrlForImage(image));
                        $cordovaFile.removeFile(cordova.file.dataDirectory, name)
                            .then(function (success) {
                                imagenes.splice(indexImage, 1);
                                window.localStorage.setItem(storageKey, JSON.stringify(imagenes));
                                resolve(imagenes);
                            }, function (error) {
                                reject(imagenes);
                            });
                    });
                },
                empty: function(storageKey){
                    var self = this;
                    return $q(function(resolve, reject){
                       var imagenes = self.images(storageKey);
                       var images = self.images(storageKey);
                        for(var cont=0; cont<imagenes.length; cont++){
                            var name = imagenes[cont].substr(imagenes[cont].lastIndexOf('/') + 1);
                            var indexImage = images.indexOf(imagenes[cont]);
                            $cordovaFile.removeFile(cordova.file.dataDirectory, name)
                                    .then(function (success) {
                                        images.splice(indexImage, 1);
                                        window.localStorage.setItem(storageKey, JSON.stringify(images));
                                        if(images.length==0){
                                            resolve(images);
                                        }
                                    }, function (error) {
                                        console.log("No es posible eliminar el archivo");
                                        if(images.length>0){
                                            reject({'detail':'No fue posible eliminar todas las imagenes'});
                                        }
                                    });
                        }
                        
                    });
                }
            }
        })
        .factory('ImageService', function($cordovaCamera, FileService, $q, $cordovaFile, $cordovaFileTransfer, URL_BASE, API_PATH, Loader) {

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
                        quality: 50,
                        destinationType: Camera.DestinationType.FILE_URI,
                        sourceType: source,
                        allowEdit: false,
                        encodingType: Camera.EncodingType.JPEG,
                        popoverOptions: CameraPopoverOptions,
                        saveToPhotoAlbum: false,
                        correctOrientation: true,
                        targetWidth: 800,
                        targetHeight: 600
                    };
                };

            function saveMedia(type, storageKey) {
                return $q(function(resolve, reject) {
                    var options = optionsForType(type);

                    $cordovaCamera.getPicture(options).then(function(imageUrl) {
                        var name = imageUrl.substr(imageUrl.lastIndexOf('/') + 1);
                        var namePath = imageUrl.substr(0, imageUrl.lastIndexOf('/') + 1);
                        var newName = makeid() + name;
                        $cordovaFile.copyFile(namePath, name, cordova.file.dataDirectory, newName)
                            .then(function(info) {
                                console.log(imageUrl);
                                console.log(JSON.stringify(info));
                                FileService.storeImage(newName,storageKey);
                                resolve(info);
                            }, function(e) {
                                console.log(JSON.stringify(e));
                                reject(e);
                            });
                    });
                })
            };

            function getImageUploadRecepiesOptions(imageURI, params, headers) {
                var options = new FileUploadOptions();
                options.fileKey = "receta";
                options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1);
                options.mimeType = "image/" + imageURI.substr(imageURI.lastIndexOf('.')+1);
                options.params = params;
                options.httpMethod = "POST";
                options.headers = headers;
                return options;
            }

            function getImageUploadInapamOptions(imageURI, params, headers) {
                var options = new FileUploadOptions();
                options.fileKey = "inapam";
                options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
                options.mimeType = "image/" + imageURI.substr(imageURI.lastIndexOf('.') + 1);
                options.params = params;
                options.httpMethod = "POST";
                options.headers = headers;
                //alert(JSON.stringify(options));
                return options;
            }

            function savedFile(file, cb) {
                return function () {
                    cb(file);
                };
            }

            return {
                createId: makeid,
                handleMediaDialog: saveMedia,
                uploadRecepies: function (image, params, headers) {
                    /*var ft =  new FileTransfer();
                    Loader.showLoading("Cargando imagenes");
                    for (var i = 0; i < images.length; i++) {
                        Loader.showLoading("Cargando " + i + "/" + images.length);
                        var image = images[i];
                        var urlImage = FileService.getUrlForImage(image);
                        ft.upload(urlImage,
                            encodeURI(URL_BASE.urlBase + API_PATH.images_ventas),
                            savedFile(image, onSuccess), onError, getImageUploadRecepiesOptions(urlImage, params, headers));
                    }
                    Loader.hideLoading();*/
                    return $q(function(resolve, reject) {
                        var url = URL_BASE.urlBase + API_PATH.images_ventas;
                        var filePath = FileService.getUrlForImage(image);
                        var options = getImageUploadRecepiesOptions(filePath, params, headers);
                        $cordovaFileTransfer.upload(url, filePath, options)
                            .then(function(result) {
                              Loader.hideLoading();
                              console.log("Exito");
                              console.log(JSON.stringify(result));
                              resolve(result);
                            }, function(err) {
                              Loader.hideLoading();
                              console.log("Error");
                              console.log(JSON.stringify(err));
                              reject(err);
                            }, function (progress) {
                              Loader.showLoading((progress.loaded / progress.total) * 100);
                            });

                    });
                },
                uploadInapam: function (image, params, headers) {
                    return $q(function(resolve, reject) {
                        Loader.showLoading("Cargando imagen");
                        var url = URL_BASE.urlBase + API_PATH.images_inapam;
                        var filePath = FileService.getUrlForImage(image);
                        var options = getImageUploadInapamOptions(filePath, params, headers);
                        /*
                         ft.upload(urlImage,
                            encodeURI(URL_BASE.urlBase + API_PATH.images_inapam),
                            savedFile(image, onSuccess), onError, getImageUploadInapamOptions(urlImage, params, headers));
                         */
                        $cordovaFileTransfer.upload(url, filePath, options)
                            .then(function(result) {
                              Loader.hideLoading();
                              console.log("Exito");
                              console.log(JSON.stringify(result));
                              resolve(result);
                            }, function(err) {
                              Loader.hideLoading();
                              console.log("Error");
                              console.log(JSON.stringify(err));
                              reject(err);
                            }, function (progress) {
                              Loader.showLoading((progress.loaded / progress.total) * 100);
                            });

                    });
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
            var user_login = function(email, password) {
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
            var user_logout = function () {
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

            var delete_card = function(card) {
                var configHttp = {
                    method: "PATCH",
                    url: URL_BASE.urlBase + API_PATH.tarjetas + card.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    },
                    data: {"active": false}
                };
                var self = this;
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var tarjetas = user.cards || [];
                                for(var cont=0; cont<tarjetas.length; cont++){
                                    if(tarjetas[cont].id==data.id){
                                        tarjetas[cont]=data;
                                        break;
                                    }
                                }
                                self.setTarjetas(tarjetas);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };

            var delete_image_inapam = function(image) {
                var imageInapam = image;
                var configHttp = {
                    method: "DELETE",
                    url: URL_BASE.urlBase + 'api/' + API_PATH.images_inapam + imageInapam.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + accessToken.auth_token
                    }
                };
                console.log(configHttp);
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var images_inapam = user.images_inapam || [];
                                var indexImage = images_inapam.indexOf(imageInapam);
                                images_inapam.splice(indexImage,1);
                                this.setImagesInapam(images_inapam);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };

            var user_me = function () {
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
            var user_register = function(objUser) {
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
            var user_update = function (objUser) {
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

            var change_password = function (objUser) {
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
            };

            return {
                login: user_login,
                logout: user_logout,
                me: user_me,
                register: user_register,
                update: user_update,
                changePassword: change_password,
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
                setTarjetas: function(cards){
                    user.cards = cards;
                    window.localStorage.setItem('user', JSON.stringify(user));
                },
                borrarTarjeta: delete_card,
                getImagesInapam: function() {
                    return user.images_inapam || [];
                },
                setImagesInapam: function(images){
                    user.images_inapam = images;
                    window.localStorage.setItem('user', JSON.stringify(user));
                },
                borrarImagesInapam: delete_image_inapam,
                getPedidosPeriodicos: function() {
                    return user.schedules_orders || [];
                },
                setPedidosPeriodicos: function(pedidos){
                    user.schedules_orders = pedidos;
                    window.localStorage.setItem('user', JSON.stringify(user));
                },
                getRecordatorios: function(){
                    return user.reminders || [];
                },
                setRecordatorios: function(reminders){
                    user.reminders = reminders;
                    window.localStorage.setItem('user', JSON.stringify(user));
                },
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
            var get_pedidos = function () {
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
                };
                var get_pedido = function (saleId) {
                    var configHttp = {
                        method: "GET",
                        url: URL_BASE.urlBase + API_PATH.ventas + saleId + "/",
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
                getPedidos: get_pedidos,
                getPedido: get_pedido
            };
        })
        .factory('Preguntas', function ($http, $timeout, $q, User ,URL_BASE, API_PATH) {
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
        .factory('Carrito', function ($q, $http, User, Direcciones, Descuentos,
                                      ImageService, FileService, PedidosPeriodicos,
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

            function crear_user_conekta(token){
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + AUTH_PATH.register_user_conekta ,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + User.getAuthToken()
                    },
                    data: {
                        token_id: token.token_id,
                        device_session_id: token.device_session_id
                    }
                };
                console.log("Token de tarjeta: " + JSON.stringify(token));
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
                setProductos: function(listado){
                    productos = listado;
                    window.localStorage.setItem('carrito', JSON.stringify(productos));
                    sumarTotal();
                    return true;
                },
                getCountProductos: function(){
                    return productos.length;
                },
                addProducto: function (item) {
                    var encontrado = false;
                    item = PedidosPeriodicos.configurarProducto(item);
                    item.periodico.quantity = item.quantity;
                    console.log(item);
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
                        inapam: 0.0,
                        iva: 0.0,
                        total: 0.0
                    };
                    var subT = 0.0, desc = 0.0, descInapam = 0.0;
                    var user = User.getUser();
                    for (var cont = 0; cont <= productos.length - 1; cont++) {
                        subT = productos[cont].price * productos[cont].quantity;
                        desc = Descuentos.calcularDescuento(productos[cont]);
                        totales.subtotal += subT;
                        totales.descuento += desc;
                        if(user.inapam == true){
                            descInapam = (subT - desc) * 0.10;
                            totales.inapam += descInapam;
                        }else{
                            descInapam = 0.0;
                        }
                        totales.iva += Descuentos.calcularIva(productos[cont],subT, desc + descInapam);
                    }

                    totales.total = totales.subtotal - totales.descuento - totales.inapam + totales.iva;

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
            function get_pedidos_periodicos() {
              return $q(function (resolve, reject) {
                  var pedidos = User.getPedidosPeriodicos();
                  resolve(pedidos);
              });
            };
            function add_pedido_periodico(producto,venta){
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
                        card_conekta: venta.card_conekta,
                        direction: venta.direction,
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
                    var pedidos = User.getPedidosPeriodicos();
                    return pedidos.length;
                },
                addPedido: function (producto, venta) {
                    var encontrado = false;
                    var pedidos = User.getPedidosPeriodicos();
                    for (var i = 0; i < pedidos.length; i++) {
                        if (pedidos[i].product.id == producto.id) {
                            encontrado = true;
                            break;
                        }
                    }
                    return $q(function(resolve, reject){
                        if(!encontrado){
                            add_pedido_periodico(producto,venta).then(function (pedido) {
                                delete producto.periodico;
                                pedido.product = producto;
                                pedidos.push(pedido);
                                User.setPedidosPeriodicos(pedidos);
                                resolve(pedido)
                            }, function (err) {
                                reject(err);
                            });
                        }else{
                            reject({'detail': producto.name + ' ya se encuentra en pedidos periodicos'});
                        }
                    });
                },
                editPedido: function(pedido){
                    var pedidos = User.getPedidosPeriodicos();
                    return $q(function(resolve, reject){
                        update_pedido_periodico(pedido).then(function(data){
                            for (var i = 0; i < pedidos.length; i++) {
                                if (pedidos[i].id == data.id) {
                                    pedidos[i] = data;
                                    break;
                                }
                            }
                            User.setPedidosPeriodicos(pedidos);
                            resolve(data);
                        },function(err){
                            reject(err);
                        });
                    });
                },
                removePedido: function (pedido) {
                    return $q(function(resolve, reject){
                        delete_pedido_periodico(pedido).then(function (confirmado) {
                            var pedidos = User.getPedidosPeriodicos();
                            pedidos.splice(pedidos.indexOf(pedido), 1);
                            User.setPedidosPeriodicos(pedidos);
                            resolve(pedidos);
                        }, function (err) {
                            reject(err);
                        });
                    });
                },
                getPedidoPeriodicoVacio: function () {
                    return {
                        id: 0,
                        pedido: false,
                        period: 'por dia',
                        days: 1,
                        times: 1,
                        quantity: 1
                    };
                },
                configurarProducto: function(producto){
                    var encontrado = false;
                    var pedidos = User.getPedidosPeriodicos();
                    for (var i = 0; i < pedidos.length; i++) {
                        if (pedidos[i].product && pedidos[i].product.id == producto.id) {
                            producto.periodico = this.getPedidoPeriodicoVacio();
                            producto.periodico.pedido = true;
                            producto.periodico.id = pedidos[i].id;
                            producto.periodico.quantity = pedidos[i].quantity;
                            producto.periodico.period = pedidos[i].period;
                            producto.periodico.days = pedidos[i].days;
                            producto.periodico.times = pedidos[i].times;
                            producto.periodico.date_next = pedidos[i].date_next;
                            if(producto.periodico.period == 'por dia'){
                                var dias = producto.periodico.days/1;
                                var leyenda = "Recibirás el producto cada "+dias+" dias";
                            }else if(producto.periodico.period == 'semanal'){
                                var semanas = producto.periodico.days/7;
                                var leyenda = "Recibirás el producto cada "+semanas+" semanas";
                            }else if(producto.periodico.period == 'mensual'){
                                var meses = producto.periodico.days/30;
                                var leyenda = "Recibirás el producto cada "+meses+" meses";
                            }
                            producto.periodico.leyend = leyenda +  ". Proxima entrega el " + producto.periodico.date_next + "";
                            console.log("configuracion de pedido peridico realizada");
                            encontrado = true;
                            break;
                        }
                    }
                    if(!encontrado){
                        producto.periodico = this.getPedidoPeriodicoVacio();
                    }
                    return producto;
                },
                configurarPedidos: function (pedidos) {
                    for (var i = 0; i < pedidos.length; i++) {
                        var product = pedidos[i];
                        var leyenda = '';
                        if (product.period == 'por dia') {
                            var dias = product.days / 1;
                            var leyenda = "Recibirás el producto cada " + dias + " dias";
                        } else if (product.period == 'semanal') {
                            var semanas = product.days / 7;
                            var leyenda = "Recibirás el producto cada " + semanas + " semanas";
                        } else if (product.period == 'mensual') {
                            var meses = product.days / 30;
                            var leyenda = "Recibirás el producto cada " + meses + " meses";
                        }
                        product.leyend = leyenda + ". Proxima entrega el  " + product.date_next + "";
                        console.log("configuracion de pedido peridico realizada");
                        pedidos[i] = product;
                    }
                    return pedidos;
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
        .factory('UIOpenPay',function($q, Carrito ){
            var get_tarjeta_token = function(tarjeta){
              return $q(function(resolve, reject){
                  var data = {
                      "card_number": tarjeta.card.number,
                      "holder_name": tarjeta.card.name,
                      "expiration_year": tarjeta.card.exp_year.substring(2),
                      "expiration_month": tarjeta.card.exp_month,
                      "cvv2": tarjeta.card.cvc
                  };
                  console.log(data);
                  OpenPay.token.create(data, function(token){
                      console.log("Respuesta Token de openpay: ");
                      console.log(token);
                      var deviceSessionId = get_device_session_id();
                      var objData = {
                          "token_id": token.data.id,
                          "device_session_id": deviceSessionId
                      };
                      Carrito.createCardConekta(objData).then(function(data){
                        console.log("Carrito Card Conekta OK");
                        console.log(data);
                        resolve(data);
                      },function(err){
                        console.log("Carrito Card Conekta BAT!!!!");
                        console.log(err);
                        reject(err);
                      });
                  }, function(err) {
                      reject(err);
                  });
              });
            };
            var validar_tarjeta = function(tarjeta){
                return OpenPay.card.validateCardNumber(tarjeta.card.number);
            };
            var validar_fecha_expiracion = function(tarjeta){
                var exp_month = tarjeta.card.exp_month || tarjeta.exp_month;
                var exp_year = tarjeta.card.exp_year || tarjeta.exp_year;
                if(exp_year.length==2){
                  exp_year = "20" + exp_year;
                }
                return OpenPay.card.validateExpiry(exp_month, exp_year);
            };
            var validar_cvc = function(tarjeta){
                return OpenPay.card.validateCVC(tarjeta.card.cvc, tarjeta.card.number);
            };
            var validar_brand = function(tarjeta){
                var brand = OpenPay.card.cardType(tarjeta.card.number);
                console.log("brand: " + brand);
                return brand != "American Express";
            };
            var get_device_session_id = function(){
                return OpenPay.deviceData.setup();
            };
            return {
                getTarjetaToken: get_tarjeta_token,
                validarTarjeta: validar_tarjeta,
                validarFechaExpiracion: validar_fecha_expiracion,
                validarCvc: validar_cvc,
                validarBrand: validar_brand,
                getDeviceSessionId: get_device_session_id
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
        .factory('Recordatorios',function(User, URL_BASE, API_PATH, $q, $http){
            var find_recordatorio = function(recordatorioId){
                var obj = null;
                var recordatorios = get_recordatorios();
                for(var i = 0; i<=recordatorios.length; i++){
                    if(recordatorios[i].id == recordatorioId){
                        obj = recordatorios[i];
                        break;
                    }
                }
                return obj;
            };

            var get_recordatorios = function(){
                var recordatorios = User.getRecordatorios();
                for(var cont=0; cont<recordatorios.length; cont++){
                    recordatorios[cont].allDays = all_days(recordatorios[cont]);
                    recordatorios[cont].weekend = only_weekend(recordatorios[cont]);
                    recordatorios[cont].monday_to_friday = only_monday_to_friday(recordatorios[cont]);
                    recordatorios[cont].leyend = getIntervaloString(recordatorios[cont]);
                    recordatorios[cont].tiempo = get_tiempo(recordatorios[cont]);
                    recordatorios[cont].tiempo_12h = get_tiempo_12h(recordatorios[cont]);
                    console.log(recordatorios[cont]);
                }
                return recordatorios;
            };

            var get_recordatorio_vacia = function(){
                var date = new Date();
                var hora = date.getHours();
                var minutos = get_minutes_corrects(date.getMinutes());
                if(minutos == 60){
                    hora += 1;
                    minutos = 0;
                    if(hora == 24){
                        hora = 0;
                    }
                }
                var recordatorio =  {
                    id: 0,
                    time: (hora<10?'0'+hora:hora) + ':' + (minutos<10?'0'+minutos:minutos) + ':00',
                    tiempo: {
                        "hora":"00",
                        "minutos": "00",
                        "horario": 'am'
                    },
                    title: "",
                    message: "",
                    monday: false,
                    tuesday: false,
                    wednesday: false,
                    thursday: false,
                    friday: false,
                    saturday: false,
                    sunday: false,
                    allDays: false,
                    weekend: false,
                    monday_to_friday: false
                };
                recordatorio.tiempo = get_tiempo(recordatorio);
                return recordatorio;
            };

            var getIntervaloString = function(recordatorio){
                var cadena = "";

                if(recordatorio.allDays){
                    return "Todos los dias";
                }
                if(recordatorio.weekend){
                    return "Sabado y Domingo";
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
            };

            var get_tiempo = function(recordatorio){
                var arreglo = recordatorio.time.split(":");
                var tiempo = {
                    "hora": "00",
                    "minutos": "00",
                    "horario": 'am'
                };
                var iHora = parseInt(arreglo[0],10);
                var hora = ((iHora<10)?'0'+iHora:iHora);
                var minutos = parseInt(arreglo[1],10);
                var horario = (iHora>=12)?'pm':'am';
                tiempo.hora = ((hora<10)?"0"+hora:""+hora);
                tiempo.minutos = ((minutos<10)?"0"+minutos:""+minutos);
                tiempo.horario = horario;
                return tiempo;

            };

            var get_tiempo_12h = function(recordatorio){
                var tiempo = get_tiempo(recordatorio);
                var iHora = parseInt(tiempo.hora,10);
                if(iHora >= 12 ){
                    iHora = iHora - 12;
                    tiempo.hora = ((iHora<10)?'0'+iHora:iHora);
                    tiempo.horario = 'pm';
                }else{
                    tiempo.horario = 'am';
                }
                return tiempo;
            };

            var get_minutes_corrects = function(minutos){
              var residuo = minutos % 5;
              if(residuo == 0){
                  return minutos;
              }else{
                  minutos += (5 - residuo);
              }
              return minutos;
            };

            var get_time = function(recordatorio){
                var hora = parseInt(recordatorio.tiempo.hora,10);
                var minutos = parseInt(recordatorio.tiempo.minutos,10);
                var horario = recordatorio.tiempo.horario;
                /*if(horario == "pm" && hora <= 11){
                    hora += 12;
                }else if(horario == "am" && hora == 12){
                    hora = 0;
                }*/
                return ((hora<10)?"0"+hora:hora) + ":" + ((minutos<10)?"0"+minutos:minutos) + ":00";
            };

            var all_days = function(n){
                return (n.monday && n.tuesday && n.wednesday && n.thursday && n.friday  && n.saturday && n.sunday);
            };

            var only_weekend = function(n){
                return (!n.monday && !n.tuesday && !n.wednesday && !n.thursday && !n.friday  && n.saturday && n.sunday);
            };

            var only_monday_to_friday = function(n){
                return (n.monday && n.tuesday && n.wednesday && n.thursday && n.friday  && !n.saturday && !n.sunday);
            };

            var get_leyend_edit = function(n){
                if(n.allDays || n.weekend || n.monday_to_friday){
                    return n.leyend;
                }else{
                    return 'Personalizar';
                }
            };

            var get_next_day = function(tiempo, dayWeek){
                var now = new Date();
                var dia = 0;
                now.setHours(parseInt(tiempo.hora,10));
                now.setMinutes(parseInt(tiempo.minutos,10));
                now.setSeconds(0);
                if(now.getDay()==dayWeek){
                    var now2 = new Date();
                    if(now.getHours()<now2.getHours()){
                        dia = 7;
                    }else if(now.getHours()==now2.getHours()){
                        if(now.getMinutes()<now2.getMinutes()){
                            dia = 7;
                        }else{
                            dia = 0;
                        }
                    }else{
                        dia = 0;
                    }
                }else if(dayWeek==0){
                    dia = 7 - now.getDay();
                }else{
                    dia = dayWeek - now.getDay();
                }
                now.setDate(now.getDate()+dia);
                return now;
            };

            var get_array_ids = function(id){
                var numero = id * 10;
                var arreglo = [numero+1,numero+2,numero+3,numero+4,numero+5,numero+6,numero+7];
                return arreglo;
            };

            var post_reminder = function(reminder) {
                var configHttp = {
                    method: "POST",
                    url: URL_BASE.urlBase + API_PATH.recordatorios ,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + User.getAuthToken()
                    },
                    data: {
                        "message": reminder.title,
                        "title": reminder.title, "time": reminder.time, "monday": reminder.monday,
                    "tuesday":reminder.tuesday, "wednesday":reminder.wednesday, "thursday":reminder.thursday,
                    "friday": reminder.friday, "saturday": reminder.saturday, "sunday": reminder.sunday,
                    "active": true }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var recordatorios = User.getRecordatorios();
                                recordatorios.push(data);
                                User.setRecordatorios(recordatorios);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };

            var put_reminder = function(reminder) {
                var configHttp = {
                    method: "PUT",
                    url: URL_BASE.urlBase + API_PATH.recordatorios + reminder.id + "/" ,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + User.getAuthToken()
                    },
                    data: {"message": reminder.message, "title": reminder.title, "time": reminder.time, "monday": reminder.monday,
                    "tuesday":reminder.tuesday, "wednesday":reminder.wednesday, "thursday":reminder.thursday,
                    "friday": reminder.friday, "saturday": reminder.saturday, "sunday": reminder.sunday,
                    "active": reminder.active}
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var recordatorios = User.getRecordatorios();
                                for(var cont=0; cont<recordatorios.length;cont++){
                                    if(recordatorios[cont].id==reminder.id){
                                        recordatorios[cont] = reminder;
                                    }
                                }
                                User.setRecordatorios(recordatorios);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };

            var delete_reminder = function(reminder) {
                var configHttp = {
                    method: "DELETE",
                    url: URL_BASE.urlBase + API_PATH.recordatorios + reminder.id + "/",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Token " + User.getAuthToken()
                    }
                };
                return $q(function (resolve, reject) {
                    $http(configHttp)
                            .success(function (data) {
                                var recordatorios = User.getRecordatorios();
                                var indexReminder = recordatorios.indexOf(reminder);
                                recordatorios.splice(indexReminder,1);
                                User.setRecordatorios(recordatorios);
                                resolve(data);
                            })
                            .error(function (err) {
                                reject(err);
                            });
                });
            };

            var parsear_recordatorios = function(recordatorio){
                var semana = [];
                var dia = {id:0, at: null};
                var dias = [recordatorio.sunday, recordatorio.monday, recordatorio.tuesday,
                recordatorio.wednesday, recordatorio.thursday, recordatorio.friday, recordatorio.saturday];
                var tiempo = get_tiempo(recordatorio);
                for(var cont=1; cont<8; cont++){
                    if(dias[cont-1]==true){
                        dia.id = (recordatorio.id*10) + cont;
                        dia.at = get_next_day(tiempo, cont-1);
                        semana.push(dia);
                        dia = {id:0, at: null};
                    }
                }
                var notificaciones = [];
                var event = {
                    id: 0,
                    at: null,
                    title: recordatorio.title,
                    text: recordatorio.title,
                    every: 'week',
                    icon: 'res://icon.png', 
                    smallIcon: 'res://icon.png',
                    data: {
                        reminderId: recordatorio.id
                    }
                };
                for(var i = 0; i < semana.length; i++){
                    event.id = semana[i].id;
                    event.at = semana[i].at;
                    notificaciones.push(event);
                    event = {
                        id: 0,
                        at: null,
                        title: recordatorio.title,
                        text: recordatorio.title,
                        every: 'week',
                        icon: 'res://icon.png', 
                        smallIcon: 'res://icon.png',
                        data: {
                            reminderId: recordatorio.id
                        }
                    };
                }
                return notificaciones;
            }


            return {
                add: post_reminder,
                update: put_reminder,
                get: get_recordatorios,
                find: find_recordatorio,
                delete: delete_reminder,
                getEmpty: get_recordatorio_vacia,
                getLeyendEdit: get_leyend_edit,
                getParseTime: get_time,
                getParserNotificaciones: parsear_recordatorios,
                getArrayIds: get_array_ids

            };
        })
        ;
