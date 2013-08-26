module.exports = function(instance) {

	var __class = {
		export: function() {
			var self = this;
			var res = {};
			_.each(_.keys(this.__keys), function(key) {
				var method = '*';
				var url = null;
				var callback = self[key];
				if(!_.isFunction(callback)) {
					return;
				};
				if(key === '*' || key === 'get://*') {
					key = '*';
					url = '*';
				} else if(key.indexOf('get://') === 0) {
					method = 'get';
					url = key.replace('get://', '/');
				} else if(key.indexOf('post://') === 0) {
					method = 'post';
					url = key.replace('post://', '/');
				} else if(key.indexOf('put://') === 0) {
					method = 'put';
					url = key.replace('put://', '/');
				} else if(key.indexOf('delete://') === 0) {
					method = 'delete';
					url = key.replace('delete://', '/');
				} else {
					return;
				}
				res[key] = {
					method: method,
					url: url,
					callback: callback
				};
			});
			return res;
		}
	};

	instance.base.controller = instance.base.base.extend(__class);

	// config type
	instance.base.controller.__type = 'controller';
	instance.base.controller.__extend = instance.base.controller.extend;
	instance.base.controller.extend = function(params) {
		var res = instance.base.controller.__extend(params);
		res.__type = instance.base.controller.__type;
		return res;
	};
};
