// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'farmApp' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'farmApp.controllers' is found in controllers.js
angular.module('farmApp', ['ionic', 'farmApp.controllers','farmApp.directives'])

        .run(function ($ionicPlatform, $rootScope, $timeout) {
            $ionicPlatform.ready(function () {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                    cordova.plugins.Keyboard.disableScroll(true);

                }
                if (window.StatusBar) {
                    // org.apache.cordova.statusbar required
                    StatusBar.styleDefault();
                }

                Conekta.setPublishableKey('key_FrzHZPkJxzRSbUNFcnpGyYw');
                
                window.plugin.notification.local.onadd = function (id, state, json) {
                    var notification = {
                        id: id,
                        state: state,
                        json: json
                    };
                    $timeout(function() {
                        $rootScope.$broadcast("$cordovaLocalNotification:added", notification);
                    });
                };
            });
        })

        .config(function ($stateProvider, $urlRouterProvider, $compileProvider) {
            $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|content|file|assets-library):/);
            $stateProvider

                    .state('login', {
                        url: '/login',
                        templateUrl: 'templates/login.html',
                        controller: 'LoginController'
                    })

                    .state('registro', {
                        url: '/registro',
                        templateUrl: 'templates/registro.html',
                        controller: 'RegistroController'
                    })

                    .state('inicio', {
                        url: '/inicio',
                        templateUrl: 'templates/inicio.html',
                        controller: 'DefaultController'
                    })

                    .state('app', {
                        url: '/app',
                        abstract: true,
                        templateUrl: 'templates/menu.html',
                        controller: 'AppController'
                    })

                    .state('app.perfil', {
                        url: '/perfil',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/perfil.html',
                                controller: 'PerfilController'
                            }
                        }
                    })

                    .state('app.search', {
                        url: '/search',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/productos.html',
                                controller: 'SearchController'
                            }
                        }
                    })

                    .state('app.contacto', {
                        url: '/contacto',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/contacto.html',
                                controller: 'ContactoController'
                            }
                        }
                    })

                    .state('app.preguntas', {
                        url: '/preguntas',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/preguntas.html',
                                controller: 'PreguntasController'
                            }
                        }
                    })

                    .state('app.periodicos', {
                        url: '/pedidos/periodicos',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/pedidosPeriodicos.html',
                                controller: 'PedidosPeriodicosController'
                            }
                        }
                    })

                    .state('app.categorias', {
                        url: '/categorias',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/categorias.html',
                                controller: 'CategoriasController'
                            }
                        }
                    })

                    .state('app.productos', {
                        url: '/productos/:categoriaId',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/productos.html',
                                controller: 'ProductosController'
                            }
                        }
                    })

                    .state('app.detalle', {
                        url: '/producto/:productoId',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/producto.html',
                                controller: 'ProductoController'
                            }
                        }
                    })

                    .state('app.carrito', {
                        url: '/carrito',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/carrito.html',
                                controller: 'CarritoController'
                            }
                        }
                    })
                    .state('app.pedido', {
                        url: '/pedido',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/pedido.html',
                                controller: 'PedidoController'
                            }
                        }
                    })
                    .state('app.pago', {
                        url: '/pago',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/pago.html',
                                controller: 'PagoController'
                            }
                        }
                    })
                    .state('app.recetas', {
                        url: '/recetas',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/recetas.html',
                                controller: 'ImageController'
                            }
                        }
                    })
                    .state('app.notificaciones', {
                        url: '/notificaciones',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/notificaciones.html',
                                controller: 'NotificacionesController'
                            }
                        }
                    })
                    ;
            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise('/inicio');
        })
        /*.run(function(djangoAuth){
         djangoAuth.initialize('//polar-hollows-6621.herokuapp.com/auth', false);
         })*/;
