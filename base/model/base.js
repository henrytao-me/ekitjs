var path = require('path');

module.exports = function(instance) {
	var __class = {
		__name: 'unknow',

		init: function() {

		},

		log: function() {
			console.log('Error ------------------------------------------------------------');
			console.log('instance', this.__name);
			console.log.apply(console, arguments);
			console.log('------------------------------------------------------------------');
		},

		pool: function(model_name) {
			// check the same model
			if(this.__name === model_name) {
				return this;
			};
			// init & filter model (only get model)
			var res = null;
			try {
				res = _.getObject(instance, model_name) || {};
				if(res.__type !== 'model') {
					return null;
				};
				res = new res();
				res.__name = model_name;
			} catch(ex) {

			};
			return res;
		},
	};
	instance.base.base = instance.Class.extend(__class);
};
