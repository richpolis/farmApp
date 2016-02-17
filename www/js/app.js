// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'farmApp' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'farmApp.controllers' is found in controllers.js
angular.module('farmApp', ['ionic','ionic.service.core', 'ionic.service.push', 
                           'farmApp.controllers','farmApp.directives',
                           'farmApp.services','ngAnimate'])

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
                
                //Conekta.setPublishableKey('key_FrzHZPkJxzRSbUNFcnpGyYw');
                
                OpenPay.setId('mpoejxraordmyeoi3naf');
                OpenPay.setApiKey('pk_9ac5b1cf9fc24904b6fac2de97c1439f');
                OpenPay.setSandboxMode(true);
                
                /*var deviceSessionId = OpenPay.deviceData.setup();
                
                localStorage.setItem('device_session_id',deviceSessionId);*/
                           
            });
        })

        .config(function ($stateProvider, $urlRouterProvider, $compileProvider) {
            $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|content|file|assets-library):/);
            $stateProvider

                    .state('login', {
                        url: '/login',
                        cache: false,
                        templateUrl: 'templates/login.html',
                        controller: 'LoginController'
                    })

                    .state('registro', {
                        url: '/registro',
                        cache: false,
                        templateUrl: 'templates/registro.html',
                        controller: 'RegistroController'
                    })

                    .state('inicio', {
                        url: '/inicio',
                        cache: false,
                        templateUrl: 'templates/inicio.html',
                        controller: 'DefaultController'
                    })

                    .state('app', {
                        url: '/app',
                        abstract: true,
                        cache: false,
                        templateUrl: 'templates/menu.html',
                        controller: 'AppController'
                    })

                    .state('app.perfil', {
                        url: '/perfil',
                        cache: false, 
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
                        cache: false,
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
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/carrito.html',
                                controller: 'CarritoController'
                            }
                        }
                    })
                    .state('app.pedido', {
                        url: '/pedido',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/pedido.html',
                                controller: 'PedidoController'
                            }
                        }
                    })
                    .state('app.notas', {
                        url: '/notas',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/notas_observaciones.html',
                                controller: 'NotasObservacionesController'
                            }
                        }
                    })
                    .state('app.pago', {
                        url: '/pago',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/pago.html',
                                controller: 'PagoController'
                            }
                        }
                    })
                    .state('app.recetas', {
                        url: '/recetas',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/recetas.html',
                                controller: 'ImageController'
                            }
                        }
                    })
                    .state('app.recordatorios', {
                        url: '/recordatorios',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/recordatorios.html',
                                controller: 'RecordatoriosController'
                            }
                        }
                    })
                    .state('app.addRecordatorio', {
                        url: '/add/recordatorio',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/formRecordatorio.html',
                                controller: 'FormRecordatorioController'
                            }
                        }
                    })
                    .state('app.editRecordatorio', {
                        url: '/edit/recordatorio/:recordatorioId',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/formRecordatorio.html',
                                controller: 'FormRecordatorioController'
                            }
                        }
                    })
                    .state('app.viewRecordatorio', {
                        url: '/recordatorios/:recordatorioId',
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/recordatorio.html',
                                controller: 'RecordatorioController'
                            }
                        }
                    })
                    ;
            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise('/inicio');
        });
