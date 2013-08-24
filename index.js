var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');

var app = express();
var def = {
	asset: null,
	db: null,
	root_path: path.join(__dirname, '..', '..'),
	config: JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'))
};
var instance = {
	Class: null,
	base: {},
	get: function(path_name){
		var res = path.basename(path_name);
		if(['Class', 'base', 'get'].indexOf(res) < 0){
			return instance[res];	
		};
		return null;
	},
	test: {}
};

// set function
exports.set = function(key, value) {
	switch(key) {
	case 'config.json':
		def.config = JSON.parse(fs.readFileSync(value, 'utf8'));
		break;
	case 'root_path':
		def.root_path = value;
		break;
	};
};

// start function
exports.start = function(callback) {

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
	MongoClient.connect(def.config.mongo_connection_string, function(err, db) {
		if(err)
			throw err;
		def.db = db;
	});

	/*
	 *
	 * init ekitjs lib
	 *
	 */

	require(path.join(__dirname, 'base', 'lib', 'express_extend.js'))(app);
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
		require(path.join(__dirname, './base/model/', value))(instance, def, app);
	});
	
	// init addon manager
	var addon = new instance.base.addon();
	
	// init static directory
	_.each(addon.addons, function(addon_path, addon_name){
		app.use(path.join('/', addon_name, 'static'), express.static(path.join(addon_path, 'static')));
	});

	// init routing - controller
	var excludes = ['Class', 'base', 'get'];
	_.each(instance, function(addons, addon_group){
		if(_.indexOf(excludes, addon_group) > -1){
			return;
		};		
		_.each(addons, function(controller, controller_name){
			if(controller.__type !== 'controller'){
				return;
			};
			// create controller instance
			var controller = new controller();
			// set controller name
			controller.__name = [addon_group, controller_name].join('.');
			// get routing
			_.each(controller.export(), function(route){
				if(route.url === '*'){
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
				}else{
					console.log(route);
					app[route.method](route.url, (function(obj, callback){
						return function(req, res, next){
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
		callback(instance, def, app);
	};

	/*
	 *
	 * start server
	 *
	 */
	
	http.createServer(app).listen(app.get('port'), function() {
		console.log('ekitjs server listening on port ' + app.get('port'));
	});
};
