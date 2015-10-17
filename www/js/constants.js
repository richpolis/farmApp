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
            images_ventas: 'api/images/ventas/',
            ratings: 'api/ratings/'
        });