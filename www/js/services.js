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
                            calle: 'Itzcuina mza. 42 lt. 69',
                            num_interior: '',
                            num_exterior: '',
                            codigo_postal: '04630',
                            colonia: 'Adolfo Ruiz Cortinez',
                            delegacion_municipio: 'Coyoacan', 
                            latitude: 0,
                            longitude: 0
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
                        user.direcciones = objUser.direcciones || [];
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
                    },
                    getDirecciones: function () {
                        return user.direcciones;
                    },
                    addDireccion: function (direccion) {
                        user.direcciones.push(direccion);
                        window.localStorage.setItem('user', JSON.stringify(user));
                        return true;
                    },
                    removeDireccion: function (direccion) {
                        user.direcciones.splice(user.direcciones.indexOf(direccion), 1);
                        window.localStorage.setItem('user', JSON.stringify(user));
                        return this.getDirecciones();
                    },
                    getDireccionVacia: function(){
                        var direccionVacia = {
                            estado: 'México DF',
                            calle: '',
                            num_exterior: '',
                            num_interior: '',
                            cp: '',
                            delegacion_municipio: '',
                            colonia: '',
                            latitude: 0,
                            longitude: 0
                        };
                        return direccionVacia;
                    },
                    save : function (objUser, callback) {
                        this.register(objUser,callback);
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
            function sumarTotal(){
                var total = 0;
                for (var cont = 0; cont <= productos.length-1; cont++) {
                    total += productos[cont].precio * productos[cont].cantidad;
                }
                return total;
            }
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
                getTotal: sumarTotal
            };
        })
        .factory('PedidosPeriodicos', function () {
            var productos = [];
            productos =  JSON.parse(window.localStorage['periodicos'] || '[]');
            
            function getPeriocidad(producto){
                if(producto.periodico.periodo == "dia"){
                    var dias = "";
                    if(producto.periodico.diaLunes){ dias += (dias.length>0?",lunes":"lunes");}
                    if(producto.periodico.diaMartes){ dias += (dias.length>0?",martes":"martes");}
                    if(producto.periodico.diaMiercoles){ dias += (dias.length>0?",miercoles":"miercoles");}
                    if(producto.periodico.diaJueves){ dias += (dias.length>0?",jueves":"jueves");}
                    if(producto.periodico.diaViernes){ dias += (dias.length>0?",viernes":"viernes");}
                    if(producto.periodico.diaSabado){ dias += (dias.length>0?",sabado":"sabado");}
                    if(producto.periodico.diaDomingo){ dias += (dias.length>0?",domingo":"domingo");}
                    return dias;
                }else{
                    return producto.periodico.periodo;
                }
            }
            
            return {
                getProductos: function () {
                    return productos;
                },
                addProducto: function (producto) {
                    producto.periodico.periocidad = getPeriocidad(producto);
                    productos.push(producto);
                    window.localStorage.setItem('periodicos', JSON.stringify(productos));
                    return true;
                },
                removeProducto: function (producto) {
                    productos.splice(productos.indexOf(producto), 1);
                    window.localStorage.setItem('periodicos', JSON.stringify(productos));
                    return productos;
                }
            };
        })
        ;