angular.module('farmApp.services', [])
.factory('User',['$http','$timeout','$window',function($http,$timeout,$window){
    var user = {};
    var defaultUser = {
    	first_name: 'Ricardo',
    	last_name: 'Alcantara',
    	email: 'richpolis@gmail.com',
    	cel: '5521093249',
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
    var res = JSON.parse($window.localStorage['user'] || '{}');
    return {
    	login: function(email, password, callback){
    		if(email==res.email && password==res.password){
    			user = res;
		        if (callback) {
		          $timeout(function() {
		            callback(user);
		          });
		        }
		    }else if(email == defaultUser.email && password == defaultUser.password){
		    	user = defaultUser;
		        if (callback) {
		          $timeout(function() {
		            callback(user);
		          });
		        }
    		}else{
    			callback({'message':'Usuario no registrado'});
    		}
    	},
	    register: function(first_name, last_name, email, cel, password, callback) {
	      res.first_name = first_name;
	      res.last_name = last_name;
	      res.email = email;
	      res.cel = cel;
	      res.password = password;
	      res.direcciones = [];
	      $window.localStorage['user'] = JSON.stringify(res);
	      user = res;
		  if (callback) {
		  	$timeout(function() {
		    	callback(user);
		   	});
		  }
    	},
    	hasUser: function(){
    		return user.first_name;
    	},    
	    getUser: function() {
	      return user;
	    },
	    logout: function() {
	      user = {};
	    },
	    getNameComplete: function(){
	    	if(this.hasUser){
	    		return user.first_name + " " + user.last_name;
	    	}else{
	    		return 'menu';
	    	}
	    }
	}
}])
.factory('Categorias',['ngResource',function($resource){
	return $resource('/js/data/categorias.json',{});
}])
.factory('Categorias',['ngResource',function($resource){
	return $resource('/js/data/productos.json',{});
}]);