GLOBAL.Addon = Class.extend({
	name: null,
	path: null,
	config: null,
	valid: false,
	def: {
		name: 'Unknow',
		version: 'Unknow',
		author: 'Unknow',
		contact: 'Unknow',
		wesite: 'Unknow',
		description: 'Unknow',
		category: 'Unknow',

		depends: [],

		css: [],
		js: [],

		auto_load: true
	},

	init: function(addon_path, addon_name) {
		// init addon
		this.path = addon_path;
		this.name = addon_name || path.basename(addon_path);
		// valid addon
		try {
			if(fs.lstatSync(this.path).isDirectory()) {
				this.valid = true;
			};
		} catch(ex) {
		};
		// init config
		if(this.valid === true) {
			var config = {};
			try {
				config = require(this.path);
				// check if not socket
				if(ekitjs.config.socket !== true && this.name === 'base') {
					var tmp = {};
					_.each(config.js, function(value) {
						tmp[value] = true;
					});
					delete tmp['http://../../socket.io/socket.io.js'];
					delete tmp['/private/socket.client.js'];
					config.js = _.keys(tmp);
				};
			} catch(ex) {
			};
			this.config = _.isObject(config, true) ? config : {};
			_.mixObject(this.config, this.def);
		};
	},

	unLoad: function() {
		return false;
		// static directory in here
		app.stack
		// remove socket listening
		io.sockets.on('connection', function(socket) {
			console.log(socket.removeAllListeners);
			socket.removeAllListeners('socket.client');
			socket.on('socket.client', function(data) {
				// do some stuff
			});
		});
	}
});
