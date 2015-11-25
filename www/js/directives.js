angular.module('farmApp.directives', [])
        .directive('map', function () {
            return {
                restrict: 'E',
                scope: {
                    onCreate: '&'
                },
                link: function ($scope, $element, $attr) {
                    function initialize() {
                        var mapOptions = {
                            center: new google.maps.LatLng(43.07493, -89.381388),
                            zoom: 16,
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        };
                        var map = new google.maps.Map($element[0], mapOptions);

                        $scope.onCreate({map: map});

                        // Stop the side bar from dragging when mousedown/tapdown on the map
                        google.maps.event.addDomListener($element[0], 'mousedown', function (e) {
                            e.preventDefault();
                            return false;
                        });
                    }

                    if (document.readyState === "complete") {
                        initialize();
                    } else {
                        google.maps.event.addDomListener(window, 'load', initialize);
                    }
                }
            }
        })
        .directive('ionGooglePlace', [
            '$ionicTemplateLoader',
            '$ionicBackdrop',
            '$ionicPlatform',
            '$q',
            '$timeout',
            '$rootScope',
            '$document',
            '$http',
            function ($ionicTemplateLoader, $ionicBackdrop, $ionicPlatform, $q, $timeout, $rootScope, $document,$http) {
                return {
                    require: '?ngModel',
                    restrict: 'E',
                    template: '<input type="search" readonly="readonly" class="ion-google-place" id="direccionBuscar" style="width: 100%;">',
                    replace: true,
                    scope: {
                        ngModel: '=?',
                        geocodeOptions: '='
                    },
                    link: function (scope, element, attrs, ngModel) {
                        var unbindBackButtonAction;

                        scope.locations = [];
                        var geocoder = new google.maps.Geocoder();
                        var searchEventTimeout = undefined;

                        var POPUP_TPL = [
                            '<div class="ion-google-place-container modal">',
                            '<div class="bar bar-header item-input-inset">',
                            '<label class="item-input-wrapper">',
                            '<i class="icon ion-ios7-search placeholder-icon"></i>',
                            '<input class="google-place-search" type="search" ng-model="searchQuery" placeholder="' + (attrs.searchPlaceholder || 'Ingresa la direccion, el lugar o codigo postal') + '">',
                            '</label>',
                            '<button class="button button-clear">',
                            attrs.labelCancel || 'Cancel',
                            '</button>',
                            '</div>',
                            '<ion-content class="has-header has-header">',
                            '<ion-list>',
                            '<ion-item ng-repeat="location in locations" type="item-text-wrap" ng-click="selectLocation(location)">',
                            '{{location.description}}',
                            '</ion-item>',
                            '</ion-list>',
                            '</ion-content>',
                            '</div>'
                        ].join('');

                        var popupPromise = $ionicTemplateLoader.compile({
                            template: POPUP_TPL,
                            scope: scope,
                            appendTo: $document[0].body
                        });

                        popupPromise.then(function (el) {
                            var searchInputElement = angular.element(el.element.find('input'));

                            scope.selectLocation = function (location) {
                                console.log("Localizacion");
                                console.log(location);
                                var req = scope.geocodeOptions || {};
                                req.address = location.description;
                                geocoder.geocode(req, function (results, status) {
                                    if (status == google.maps.GeocoderStatus.OK) {

                                        console.log("Resultados");
                                        console.log(results[0]);    


                                        ngModel.$setViewValue(results[0]);
                                        ngModel.$render();
                                        el.element.css('display', 'none');
                                        $ionicBackdrop.release();

                                        if (unbindBackButtonAction) {
                                            unbindBackButtonAction();
                                            unbindBackButtonAction = null;
                                        }
                                    } else {
                                        // @TODO: Figure out what to do when the geocoding fails
                                    }
                                });
                            };

                            scope.$watch('searchQuery', function (query) {
                                if (searchEventTimeout)
                                    $timeout.cancel(searchEventTimeout);
                                    searchEventTimeout = $timeout(function () {
                                    if (!query)
                                        return;
                                    if (query.length < 3)
                                        ;
                                        
                                    var displaySuggestions = function (predictions, status) {
                                        if (status != google.maps.places.PlacesServiceStatus.OK) {
                                            alert(status);
                                            return;
                                        }

                                        scope.$apply(function () {
                                            scope.locations = predictions;
                                        });
                                    };

                                    var service = new google.maps.places.AutocompleteService();
                                    service.getQueryPredictions({input: query}, displaySuggestions);    
                                    
                                }, 350); // we're throttling the input by 350ms to be nice to google's API
                            });

                            var onClick = function (e) {
                                e.preventDefault();
                                e.stopPropagation();

                                $ionicBackdrop.retain();
                                unbindBackButtonAction = $ionicPlatform.registerBackButtonAction(closeOnBackButton, 250);

                                el.element.css('display', 'block');
                                searchInputElement[0].focus();
                                setTimeout(function () {
                                    searchInputElement[0].focus();
                                }, 0);
                            };

                            var onCancel = function (e) {
                                scope.searchQuery = '';
                                $ionicBackdrop.release();
                                el.element.css('display', 'none');

                                if (unbindBackButtonAction) {
                                    unbindBackButtonAction();
                                    unbindBackButtonAction = null;
                                }
                            };

                            closeOnBackButton = function (e) {
                                e.preventDefault();

                                el.element.css('display', 'none');
                                $ionicBackdrop.release();

                                if (unbindBackButtonAction) {
                                    unbindBackButtonAction();
                                    unbindBackButtonAction = null;
                                }
                            }

                            element.bind('click', onClick);
                            element.bind('touchend', onClick);

                            el.element.find('button').bind('click', onCancel);
                        });

                        if (attrs.placeholder) {
                            element.attr('placeholder', attrs.placeholder);
                        }


                        ngModel.$formatters.unshift(function (modelValue) {
                            if (!modelValue)
                                return '';
                            return modelValue;
                        });

                        ngModel.$parsers.unshift(function (viewValue) {
                            return viewValue;
                        });

                        ngModel.$render = function () {
                            if (!ngModel.$viewValue) {
                                element.val('');
                            } else {
                                element.val(ngModel.$viewValue.formatted_address || '');
                            }
                        };

                        scope.$on("$destroy", function () {
                            if (unbindBackButtonAction) {
                                unbindBackButtonAction();
                                unbindBackButtonAction = null;
                            }
                        });
                    }
                };
            }
        ])
        .directive('googleplace', function () {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, model) {
                    var options = {
                        types: [],
                        componentRestrictions: {}
                    };
                    scope.gPlace = new google.maps.places.Autocomplete(element[0], options);

                    google.maps.event.addListener(scope.gPlace, 'place_changed', function () {
                        scope.$apply(function () {
                            model.$setViewValue(element.val());
                        });
                    });
                }
            };
        })
        .directive('disableTap', function($timeout) {
            return {
              link: function() {
                $timeout(function() {
                  container = document.getElementsByClassName('pac-container');
                  // disable ionic data tab
                  angular.element(container).attr('data-tap-disabled', 'true');
                  // leave input field if google-address-entry is selected
                  angular.element(container).on("click", function(){
                      document.getElementById('direccionBuscar').blur();
                  });

                },500);

              }
            };
          });
