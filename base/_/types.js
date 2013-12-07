/*
 * Init types
 * Quick type access
 */

GLOBAL.types = instance.base.types = {};

instance.base.types.refresh = function() {
	// reset types value
	_.each(instance.base.types, function(value, key) {
		if(key !== 'refresh') {
			delete instance.base.types[key];
		};
	});

	// init types
	_.each(instance.base.type, function(value, key) {
		instance.base.types[key] = (function(value, key) {
			return function(opt) {
				opt === undefined ? opt = {} : null;
				var res = new value(opt);
				res.__type === undefined ? res.__type = key : null;
				return res;
			};
		})(value, key);
	});
};

instance.base.types.refresh();
