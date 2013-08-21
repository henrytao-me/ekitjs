module.exports = function(instance) {

	/*
	 * Init types
	 * Quick type access
	 */
	
	instance.base.types = {};
	
	instance.base.types.__reload = function(){
		// reset types value
		instance.base.types = {};
		
		// init types
		_.each(instance.base.type, function(value, key){
			instance.base.types[key] = (function(value, key){
				return function(opt){
				 	opt === undefined ? opt = {} : null;
				 	var res = new value(opt);
				 	res.__type = key;
				 	return res;
				};
			})(value, key);
		});
	};
	
	instance.base.types.__reload();
};
