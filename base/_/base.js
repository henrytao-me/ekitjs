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
			res = _.getObject(instance, model_name);
			if(res.__class === true) {
				res = new res();
				res.__name = model_name;
			};
		} catch(ex) {
			return null;
		};
		return res;
	},
};
instance.base.base = Class.extend(__class);
