console.log('');
/*
 * Static variable:
 * Class, def, app, server, io, instance, types, path, fs
 */

var express = require('express');
GLOBAL.path = require('path');
GLOBAL.fs = require('fs');

GLOBAL.app = express();
GLOBAL.server = require('http').createServer(app);
GLOBAL.io = require('socket.io').listen(server, {
	log: true
});
GLOBAL.def = {
	addon: null,
	asset: null,
	config: JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')),
	db: null,
	root_path: path.join(__dirname, '..', '..')
};
GLOBAL.Class = null;
var instance = {
	Class: null,
	base: {},
	get: function(path_name) {
		var res = path.basename(path_name);
		if(['Class', 'base', 'get'].indexOf(res) < 0) {
			return instance[res];
		};
		return null;
	},
	test: {}
};

// set function
exports.set = function(key, value) {
	switch(key) {
	case 'root_path':
		def.root_path = value;
		try {
			def.config = JSON.parse(fs.readFileSync(path.join(def.root_path, 'config.json'), 'utf8'));
		} catch(ex) {
		};
		break;
	};
};

// start function
exports.start = function(root_path, callback) {

	exports.set('root_path', root_path);

	/*
	 *
	 * config express
	 *
	 */

	app.set('port', def.config.port || process.env.PORT || 3000);
	app.set('views', path.join(def.root_path));
	app.engine('html', require('ejs').renderFile);
	app.set('view engine', def.config['view engine']);
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.compress());
	if(app.get('env') === 'development') {
		app.use(express.errorHandler());
	};
	if(app.get('env') === 'production') {
		// TODO
	};

	/*
	 *
	 * setup mongoose
	 *
	 */

	var MongoClient = require('mongodb').MongoClient;
	if(def.config.mongo_connection_string !== null) {
		MongoClient.connect(def.config.mongo_connection_string, function(err, db) {
			if(err)
				throw err;
			def.db = db;
		});
	};
	
	/*
	 *
	 * init ekitjs lib
	 *
	 */

	require(path.join(__dirname, 'base', 'lib', 'js_extend.js'));
	require(path.join(__dirname, 'base', 'lib', 'underscore_extend.js'));
	def.asset = require(path.join(__dirname, 'base', 'lib', 'asset.js'));

	/*
	*
	* init ekit app
	*
	*/

	// load base model to instance
	_.each(['Class', 'base', 'type', 'types', 'controller', 'model', 'addon'], function(value) {
		require(path.join(__dirname, './base/base/', value))(instance);
	});
	GLOBAL.Class = instance.Class;
	
	// init socket.io
	if(def.config['socket.io'] === true){
		require(path.join(__dirname, './base/base/socket.io.js'))(instance);
	};

	// init addon manager
	var addon = def.addon = new instance.base.addon();

	// init static directory
	_.each(addon.addons, function(addon_path, addon_name) {
		app.use(path.join('/', addon_name, 'static'), express.static(path.join(addon_path, 'static')));
	});

	// init routing - controller
	var excludes = ['Class', 'base', 'get'];
	_.each(instance, function(addons, addon_group) {
		if(_.indexOf(excludes, addon_group) > -1) {
			return;
		};
		_.each(addons.controller, function(controller, controller_name) {
			if(controller.__type !== 'controller') {
				return;
			};
			// create controller instance
			var controller = new controller();
			// set controller name
			controller.__name = [addon_group, controller_name].join('.');
			// get routing
			_.each(controller.export(), function(route) {
				if(route.url === '*') {
					app.use((function(obj, callback) {
						return function(req, res, next) {
							// split request path
							var req_path = req.path.split('/');
							// check static url
							if(controller[req_path[1]] && req_path[2] == 'static') {
								return next();
							};
							// callback
							callback.call(obj, req, res, next);
						};
					})(controller, route.callback));
				} else {
					app[route.method](route.url, (function(obj, callback) {
						return function(req, res, next) {
							callback.call(obj, req, res, next);
						};
					})(controller, route.callback));
				};
			});
		});
	});

	/*
	 *
	 * callback before start server
	 *
	 */

	if(_.isFunction(callback)) {
		callback(instance, def, app, server, io);
	};

	/*
	 *
	 * start server
	 *
	 */

	server.listen(app.get('port'), function() {
		console.log('=> ekitjs server listening on port ' + app.get('port'));
		console.log('');
	});
};
