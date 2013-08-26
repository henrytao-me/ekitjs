module.exports = function(app) {
	// extend app data
	var ekit_data = {};
	app.data = function(key, value) {
		if(typeof value === 'undefined') {
			return ekit_data[key];
		} else {
			ekit_data[key] = value;
		};
	};
};
