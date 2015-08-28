angular.module('farmApp.services', ['ngResource'])
        .factory('User', ['$http', '$timeout', function ($http, $timeout) {
                var user = {};
                var defaultUser = {
                    first_name: 'Ricardo',
                    last_name: 'Alcantara',
                    email: 'richpolis@gmail.com',
                    cell: '5521093249',
                    password: 'D3m3s1s1',
                    direcciones: [
                        {
                            id: '1',
                            localidad: 'Mexico D.F.',
                            street: 'Itzcuina mza. 42 lt. 69',
                            num_interior: '',
                            num_exterior: '',
                            codigo_postal: '04630',
                            colonia: 'Adolfo Ruiz Cortinez',
                            delegacion_municipio: 'Coyoacan'
                        }
                    ]
                };
                return {
                    login: function (email, password, callback) {
                        user = this.getUser();
                        if (email == user.email && password == user.password) {
                            if (callback) {
                                $timeout(function () {
                                    callback(user);
                                });
                            }
                        } else if (email == defaultUser.email && password == defaultUser.password) {
                            user = defaultUser;
                            window.localStorage.setItem('user', JSON.stringify(user));
                            if (callback) {
                                $timeout(function () {
                                    callback(user);
                                });
                            }
                        } else {
                            callback({'message': 'Usuario no registrado'});
                        }
                    },
                    register: function (objUser, callback) {
                        user = objUser;
                        user.direcciones = [];
                        window.localStorage.setItem('user', JSON.stringify(user));
                        if (callback) {
                            $timeout(function () {
                                callback(user);
                            });
                        }
                    },
                    hasUser: function () {
                        user = this.getUser();
                        return user.first_name;
                    },
                    getUser: function () {
                        return JSON.parse(window.localStorage['user'] || '{}');
                    },
                    logout: function () {
                        user = {};
                        window.localStorage.setItem('user', JSON.stringify(user));
                    },
                    getNameComplete: function () {
                        if (this.hasUser()) {
                            return user.first_name + " " + user.last_name;
                        } else {
                            return 'menu';
                        }
                    }
                }
            }])
        .factory('Preguntas', function ($resource) {
            return $resource('js/data/preguntas.json', {});
        })
        .factory('Categorias', function ($resource) {
            return $resource('js/data/categorias.json', {});
        })
        .factory('Productos', function ($resource) {
            return $resource('js/data/productos.json', {});
        })
        .factory('Carrito', function () {
            var productos = [];
            productos =  JSON.parse(window.localStorage['carrito'] || '[]');
            return {
                getProductos: function () {
                    return productos;
                },
                addProducto: function (producto) {
                    productos.push(producto);
                    window.localStorage.setItem('carrito', JSON.stringify(productos));
                    return true;
                },
                removeProducto: function (producto) {
                    productos.splice(productos.indexOf(producto), 1);
                    window.localStorage.setItem('carrito', JSON.stringify(productos));
                    return productos;
                },
                getTotal: function(){
                    var total = 0;
                    for (var cont = 0; cont <= productos.length-1; cont++) {
                        total += productos[cont].precio * productos[cont].cantidad;
                    }
                    return total;
                }
            };
        })

        ;