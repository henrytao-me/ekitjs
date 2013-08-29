console.log('');
/*
 * Static variable:
 * fs, path, _, Class
 * express, app, server, io
 * ekitjs, Addon, instance, types
 */

GLOBAL.fs = require('fs');
GLOBAL.path = require('path');
GLOBAL._ = require('underscore');
require(path.join(__dirname, 'core', 'lib', 'js_extend.js'));
require(path.join(__dirname, 'core', 'lib', 'underscore_extend.js'));
require(path.join(__dirname, 'core', 'lib', 'Class.js'));

GLOBAL.express = require('express');
GLOBAL.app = express();
GLOBAL.server = require('http').createServer(app);
GLOBAL.io = require('socket.io').listen(server, {
	log: false
});

GLOBAL.ekitjs = null;
GLOBAL.Addon = null;
GLOBAL.instance = {};
GLOBAL.types = {};
require(path.join(__dirname, 'core', 'addon.js'));

var ekit_dir = require('ekit-dir');

/*
 * Define ekitjs
 */
ekitjs = Class.extend({

	base_path: path.join(__dirname, 'base'),
	// default config
	def: JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')),
	db: null,
	config: null,
	root_path: path.join(__dirname, '..', '..'),
	addons: null,
	asset: null,
	core_asset: null,

	init: function() {
		// init default data
		this.addons = {};
		// init get function support in instance
		instance.get = function(path_name) {
			if(_.indexOf(['_', 'controller', 'model'], path.basename(path_name)) >= 0) {
				path_name = path.join(path_name, '..');
			};
			var res = path.basename(path_name);
			if(['get'].indexOf(res) < 0) {
				return instance[res];
			};
			return null;
		};
	},

	pool: function(model_name) {
		var base = new instance.base.base();
		return base.pool(model_name);
	},

	set: function(key, value) {
		switch(key) {
		case 'root_path':
			this.root_path = value;
			try {
				this.config = JSON.parse(fs.readFileSync(path.join(this.root_path, 'config.json'), 'utf8'));
			} catch(ex) {
			};
			!_.isObject(this.config, true) ? this.config = {} : null;
			_.mixObject(this.config, this.def);
			break;
		};
	},

	start: function(root_path, callback) {

		var self = this;

		/*
		 * set root_path & config
		 */

		this.set('root_path', root_path);

		/*
		 *
		 * config express
		 *
		 */

		app.set('port', this.config.port || process.env.PORT || 3000);
		app.set('views', path.join(this.root_path));
		app.engine('html', require('ejs').renderFile);
		app.set('view engine', this.config['view engine']);
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
		if(this.config.mongo_connection_string !== null) {
			MongoClient.connect(this.config.mongo_connection_string, function(err, db) {
				if(err)
					throw err;
				self.db = db;
			});
		};

		/*
		 *
		 * Load all available addon
		 *
		 */

		var addons = [];
		var addons_path = {
			base: this.base_path
		};
		_.mixObject(addons_path, this.collectAddonPath());

		// filter valid and auto_load addon
		_.each(addons_path, function(addon_path, addon_name) {
			var addon = new Addon(addon_path, addon_name);
			if(addon.valid === true && addon.config.auto_load === true) {
				addons.push(addon);
			};
		}, undefined, this);

		// start load addon
		var res = this.loadAddon(addons, {
			force: true
		});
		if(res !== true) {
			throw {
				message: 'load addon fail',
				info: res
			};
		};

		/*
		 *
		 * init asset
		 *
		 */

		this.asset = new instance.base.asset();
		this.core_asset = new instance.base.asset();

		/*
		 * init static directory
		 */

		_.each(this.addons, function(addon) {
			app.use(path.join('/', addon.name, 'static'), express.static(path.join(addon.path, 'static')));
		});

		/*
		 *
		 * init routing - controller
		 *
		 */

		_.each(_.encodeObject(instance, '__class'), function(controller, key) {
			if(controller.__type !== 'controller') {
				return;
			};
			// init controller
			controller = new controller();
			// get routing
			_.each(controller.export(), function(route) {
				if(route.url === '*') {
					app.use((function(obj, callback) {
						return function(req, res, next) {
							// split request path
							var req_path = req.path.split('/');
							// check static url
							if(self.addons[req_path[1]] && req_path[2] == 'static') {
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
			}, undefined, this);
		}, undefined, this);

		/*
		 *
		 * callback before start server
		 *
		 */

		if(_.isFunction(callback)) {
			callback();
		};

		/*
		 *
		 * finalize ekit core script
		 *
		 */

		if(this.config['socket'] === true) {
			// load css & js
			this.loadAsset(this.core_asset, this.addons.base);
			// optimize asset
			_.each(['js', 'css'], function(type) {
				var content = '';
				content += this.core_asset.render(type, 'files');
				content += this.core_asset.render(type, 'scripts');
				try {
					content = require('ekit-minify').minify({
						ext: '.' + type,
						data: content
					});
					fs.writeFileSync(path.join(__dirname, 'base', 'static', type, 'ekitjs.min.' + type), content);
				} catch(ex) {
				};
			}, undefined, this);
			//extra addon from base
			_.each(['js', 'css'], function(type) {
				_.each(this.core_asset.data[type].urls, function(url) {
					this.asset.addUrl(type, url);
				}, undefined, this);
			}, undefined, this);
		};
		//normal addon
		_.each(this.addons, function(addon) {
			if(addon.name === 'base') {
				return;
			};
			this.loadAsset(this.asset, addon);
		}, undefined, this);

		/*
		 *
		 * start server
		 *
		 */

		server.listen(app.get('port'), function() {
			console.log('=> ekitjs server listening on port ' + app.get('port'));
			console.log('');
		});

	},

	collectAddonPath: function() {
		var res = {};
		// collect ekit_package

		_.each(this.config.ekit_node_modules, function(module_name, addon_name) {
			if(res[addon_name] === undefined && addon_name !== 'base') {
				res[addon_name] = path.join(this.root_path, 'node_modules', module_name);
			} else {
				throw 'Duplicate addon name on node_modules: <' + addon_name + '> in: <' + res[addon_name] + '> & <' + path.join(this.root_path, 'node_modules', module_name) + '>';
			};
		}, undefined, this);

		// collect addons_path
		_.each(this.config.addons_path, function(addon_path) {
			_.each(ekit_dir.subdirs(path.join(this.root_path, addon_path)), function(addon_name) {
				if(res[addon_name] === undefined && addon_name !== 'base') {
					res[addon_name] = path.join(this.root_path, addon_path, addon_name);
				} else {
					throw 'Duplicate addon name: <' + addon_name + '> in: <' + res[addon_name] + '> & <' + path.join(this.root_path, addon_path, addon_name) + '>';
				};
			}, undefined, this);
		}, undefined, this);
		return res;
	},

	loadAsset: function(asset, addon) {
		_.each(['css', 'js'], function(type) {
			_.each(addon.config[type], function(link) {
				if(link.indexOf('http://') === 0 || link.indexOf('https://') === 0) {
					if(link.indexOf('http://../') === 0) {
						link = link.replace('http://../', '/' + addon.name + '/');
					};
					asset.addUrl(type, link);
				} else {
					asset.addFile(type, path.join(addon.path, link));
				};
			});
		});
	},

	loadAddon: function(addons, opt) {// addon object, addon array
		_.mixObject(opt, {
			force: false
		});

		// init addon object
		!_.isArray(addons) ? addons = [addons] : null;
		var isValid = true;
		_.each(addons, function(addon) {
			if(addon.__class !== true) {
				isValid = false;
			};
		});
		if(isValid !== true) {
			return false;
		};

		// backup addons name
		var addons_name = _.keys(this.addons);

		// start load addons
		var error_addons = {};
		while(true) {
			var loaded = false;
			_.each(addons, function(addon, i) {
				// check already loaded
				if(this.addons[addon.name]) {
					error_addons[addon.name] === undefined ? error_addons[addon.name] = {} : null;
					error_addons[addon.name].type = 'loaded';
					error_addons[addon.name].addon = addon;
					return;
				};

				// check if addon not valid
				if(!addon.valid) {
					error_addons[addon.name] === undefined ? error_addons[addon.name] = {} : null;
					error_addons[addon.name].type = 'invalid';
					error_addons[addon.name].addon = addon;
					return;
				};

				// check depends
				var depending = false;
				_.each(addon.config.depends, function(depend) {
					if(this.addons[depend] === undefined) {
						depending = true;
					};
				}, undefined, this);
				if(depending) {
					return;
				};
				this.addons[addon.name] = addon;
				delete addons[i];
				loaded = true;
			}, undefined, this);
			if(loaded === false) {
				break;
			};
		};

		// check error & rollback
		_.each(addons, function(addon) {
			if(!error_addons[addon.name]) {
				error_addons[addon.name] = {
					type: 'depend',
					info: addon
				};
			};
		}, undefined, this);
		if(_.keys(error_addons).length > 0 && force !== true) {// rollback
			_.each(this.addons, function(addon, name) {
				if(_.indexOf(addons_name, name) < 0 && this.addons[name]) {
					delete this.addons[name];
				};
			}, undefined, this);
			return error_addons;
		};

		// detach new addons
		var new_addons = {};
		_.each(this.addons, function(addon, name) {
			if(_.indexOf(addons_name, name) < 0 && this.addons[name]) {
				new_addons[name] = addon;
				delete this.addons[name];
			};
		}, undefined, this);

		// load new addons detail
		_.each(new_addons, function(addon) {

			// init addon name in instance
			instance[addon.name] === undefined ? instance[addon.name] = {} : null;

			// get all models: auto load from controller + model folder
			var models = {
				controller: [],
				model: [],
				_: []
			};
			_.each(['controller', 'model', '_'], function(type) {
				try {
					// get model in alphabe
					_.each(fs.readdirSync(path.join(addon.path, type)), function(model) {
						if(!fs.lstatSync(path.join(path.join(addon.path, type), model)).isDirectory()) {
							models[type].push(path.join(addon.path, type, model));
						};
					}, undefined, this);
				} catch(ex) {
				};
			}, undefined, this);

			// load addon models to instance
			_.each(models, function(models, type) {
				_.each(models, function(model_path) {
					var model = require(model_path);
					// auto load object define
					if(_.isObject(model, true)) {
						if(_.keys(model).length > 0) {
							if(type !== '_') {// auto create: <addon_name>.<controller | model>.<filename>
								var tmp = {};
								var a = [addon.name, type, path.basename(model_path, '.js')].join('.');
								var b = instance.base[type].extend(model);
								tmp[a] = b;
								_.setObject(instance, tmp, true);
							} else {// extend if override, include if not
								try {
									if(model_path.lastIndexOf('.override.js') >= 0) {// override
										var tmp = path.basename(model_path, '.override.js');
										var obj = _.getObject(instance, tmp) || {};
										if(obj.__class) {
											if(_.isFunction(obj.extend)) {
												var a = tmp;
												var b = Class.extend(model);
												tmp = {};
												tmp[a] = b;
												_.setObject(instance, tmp, true);
											} else {
												throw false;
											};
										} else {
											throw false;
										};
									} else {// include
										var tmp = path.basename(model_path, '.js');
										var obj = _.getObject(instance, tmp) || {};
										if(obj.__class) {
											if(_.isFunction(obj.include)) {
												obj.include(model);
											} else {
												throw false;
											};
										} else {
											throw false;
										};
									};
								} catch(ex) {
									console.log("Can not load: " + model_path);
								};
							};
						};
					};
				}, undefined, this);
			}, undefined, this);

			// check null addon
			_.keys(instance[addon.name]).length === 0 ?
			delete instance[addon.name] : null;

			// update this.addons
			this.addons[addon.name] = addon;
		}, undefined, this);

		// return
		if(_.keys(error_addons).length > 0) {
			return error_addons;
		};
		return true;
	}
});
ekitjs = new ekitjs();

// set function
exports.set = function(key, value) {
	ekitjs.set.apply(ekitjs, arguments);
};

// start function
exports.start = function(root_path, callback) {
	ekitjs.start.apply(ekitjs, arguments);
};
