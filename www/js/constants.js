angular.module('farmApp')
.constant('URL_BASE', {
    urlBase: 'http://farmaapp.mx/',
    urlConekta: 'https://api.conekta.io/charges'
})
.constant('AUTH_PATH', {
    login: 'auth/login/',
    logout: 'auth/logout/',
    me: 'auth/me/',
    register: 'auth/register/',
    change_password: 'auth/password/',
    register_user_conekta: 'usuarios/register/user/conekta/'
})
.constant('API_PATH', {
    categorias: 'api/categorias/',
    productos: 'api/productos/',
    usuarios: 'api/usuarios/',
    direcciones: 'api/direcciones/',
    preguntas: 'api/preguntas/',
    ventas: 'api/ventas/',
    detalle_ventas: 'api/detalle/ventas/',
    pedidos_periodicos: 'api/pedidos/periodicos/',
    images_ventas: 'images/ventas/',
    images_inapam: 'images/inapam/',
    ratings: 'api/ratings/',
    tokens_phone: 'api/tokens/phone/',
    tarjetas: 'api/cards/',
    recordatorios: 'api/reminders/',
    contacto: 'contacto/',
    recover_password: 'solicitud/recuperar/password/'
})
.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
