angular.module('farmApp.services', ['ngResource'])
.factory('User',['$http','$timeout','$window',function($http,$timeout,$window){
    var user = JSON.parse($window.localStorage['user'] || '{}');
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
    return {
    	login: function(email, password, callback){
    		if(email==user.email && password==user.password){
    			if (callback) {
		          $timeout(function() {
		            callback(user);
		          });
		        }
		    }else if(email == defaultUser.email && password == defaultUser.password){
		    	user = defaultUser;
		    	$window.localStorage['user'] = JSON.stringify(user);
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
	      user.first_name = first_name;
	      user.last_name = last_name;
	      user.email = email;
	      user.cel = cel;
	      user.password = password;
	      user.direcciones = [];
	      $window.localStorage['user'] = JSON.stringify(user);
	      if (callback) {
		  	$timeout(function() {
		    	callback(user);
		   	});
		  }
    	},
    	hasUser: function(){
    		user = this.getUser();
    		return user.first_name;
    	},    
	    getUser: function() {
	      return JSON.parse($window.localStorage['user'] || '{}');
	    },
	    logout: function() {
	      user = {};
	      $window.localStorage['user'] = JSON.stringify(user);
	    },
	    getNameComplete: function(){
	    	if(this.hasUser()){
	    		return user.first_name + " " + user.last_name;
	    	}else{
	    		return 'menu';
	    	}
	    },
	    user: user
	}
}])
.factory('Categorias',function($resource){
	return $resource('/js/data/categorias.json',{});
})
.factory('Categorias',function($resource){
	return $resource('/js/data/productos.json',{});
});