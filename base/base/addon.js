var ekit_dir = require('ekit-dir');

module.exports = function(instance) {
	var _class = {

		addons: {},

		init: function() {
			var addons = this.collect();
			addons = this.validate(addons);
			addons = this.filter_auto_load(addons);
			addons = this.build_dependency(addons);
			this.load(addons);
		},

		init_addons: function(addons) {
			if(_.isObject(addons) && !_.isArray(addons)) {
				return addons;
			};
			var res = {};
			res[path.basename(addons)] = addons;
			return res;
		},

		collect: function(type) {
			var res = {};
			// reset addons_path
			this.addons_path = {};
			// collect addons
			_.each(def.config.addons_path, function(addon_path) {
				_.each(ekit_dir.subdirs(path.join(def.root_path, addon_path)), function(addon_name) {
					if(res[addon_name] === undefined) {
						res[addon_name] = path.join(def.root_path, addon_path, addon_name);
					} else {
						throw 'Duplicate addon name: <' + addon_name + '> in: <' + res[addon_name] + '> & <' + path.join(def.root_path, addon_path, addon_name) + '>';
					};
				});
			});
			return res;
		},

		validate: function(addons) {
			addons = this.init_addons(addons);
			var res = {};
			_.each(addons, function(value, key) {
				try {
					if(require(value).config === undefined) {
						return;
					};
					res[key] = value;
				} catch(ex) {
				};
			});
			return res;
		},

		filter_auto_load: function(addons) {
			addons = this.init_addons(addons);
			res = {};
			_.each(addons, function(value, key) {
				if(require(value).config.auto_load === true) {
					res[key] = value;
				};
			});
			return res;
		},

		build_dependency: function(addons) {
			addons = this.init_addons(addons);
			var res = {};
			// get dependency
			var loaded = {};
			var depend = {}
			_.each(addons, function(addon_path, addon_name) {
				loaded[addon_name] = false;
				depend[addon_name] = require(addon_path).config.depends || [];
			});
			// check dependency
			while(true) {
				var remains = {};
				var preadds = {};
				_.each(addons, function(addon_path, addon_name) {
					var ipass = true;
					_.each(depend[addon_name], function(addon_depend) {
						if(loaded[addon_depend] !== true) {
							ipass = false;
						};
					});
					if(ipass === true) {
						preadds[addon_name] = addon_path;
					} else {
						remains[addon_name] = addon_path;
					};
				});
				addons = remains;
				if(_.keys(preadds).length === 0) {
					break;
				} else {
					// sort preadds by config sequence
					_.sortObject(preadds, function(a, b) {
						return (require(a).config.sequence || 10) - (require(b).config.sequence || 10);
					});
					// add preadds to res
					_.each(preadds, function(value, key) {
						res[key] = value;
						loaded[key] = true;
					});
				};
			};
			// check loop dependency if exists
			if(addons.length > 0) {
				throw 'Loop dependency in somewhere. Check remain addons: ' + addons.toString();
			};
			return res;
		},

		load: function(addons) {
			addons = this.init_addons(addons);
			_.each(addons, function(addon_path, addon_name) {
				// check addon exists
				if(this.addons[addon_name] !== undefined) {
					throw {
						message: 'Duplicate addon name',
						loaded_addon: {
							name: addon_name,
							path: this.addons[addon_name]
						},
						loading_addon: {
							name: addon_name,
							path: addon_path
						}
					};
				};

				// init addon name in instance
				instance[addon_name] === undefined ? instance[addon_name] = {} : null;
				_.each(['controller', 'model'], function(value) {
					instance[addon_name][value] === undefined ? instance[addon_name][value] = {} : null;
				});

				// get addon config
				var config = null;
				try {
					config = require(addon_path).config || {};
				} catch(ex) {
					throw {
						message: 'Invalid addon. Require config data.',
						addon_name: addon_name
					};
				};

				// check dependency
				_.each(config.depends, function(depend_name) {
					if(this.addons[depend_name] === undefined) {
						throw {
							message: 'Load addon fail',
							addon_name: addon_name,
							depend: depend_name,
							depends: config.depends
						};
					};
				}, undefined, this);

				// get all models: auto load from controller + model folder
				var models = {
					controller: [],
					model: []
				};
				_.each(['controller', 'model'], function(type) {
					try {
						_.each(fs.readdirSync(path.join(addon_path, type)), function(model) {
							if(!fs.lstatSync(path.join(path.join(addon_path, type), model)).isDirectory()) {
								models[type].push(path.join(addon_path, type, model));
							};
						});
					} catch(ex) {
					};
				});

				// load addon models to instance
				_.each(models, function(models, type) {
					_.each(models, function(model_path) {
						var model = require(model_path);
						if(_.isFunction(model)) {
							// normal load
							model(instance);
						} else {
							// auto load object define
							if(_.isObject(model) && !_.isArray(model)) {
								if(_.keys(model).length > 0) {
									instance[addon_name][type][path.basename(model_path, '.js')] = instance.base[type].extend(model);
								} else {
									console.log("Can not load: " + model_path);
								};
							} else {
								console.log("Can not load: " + model_path);
							};
						};
					});
				});

				// load extra models in _ folder
				var extra = [];
				try {
					_.each(fs.readdirSync(path.join(addon_path, '_')), function(model) {
						if(!fs.lstatSync(path.join(path.join(addon_path, '_'), model)).isDirectory()) {
							extra.push(path.join(addon_path, '_', model));
						};
					});
				} catch(ex) {
				};
				_.each(extra, function(model_path) {
					var model = require(model_path);
					if(_.isFunction(model)) {
						model(instance);
					} else {
						if(_.isObject(model) && !_.isArray(model)) {
							var model_name = path.basename(model_path, '.js').split('.');
							var isOverride = false;
							if(model_name[model_name.length - 1] === 'override') {
								model_name.pop();
								isOverride = true;
							};
							if(_.getObject(instance, model_name) !== undefined) {
								if(isOverride) {
									if(_.keys(model).length > 0) {
										instance[model_name[0]][model_name[1]][model_name[2]] = instance[model_name[0]][model_name[1]][model_name[2]].extend(model);
									} else {
										console.log("Can not load: " + model_path);
									};
								} else {
									instance[model_name[0]][model_name[1]][model_name[2]].include(model);
								};
							} else {
								console.log("Can not load: " + model_path);
							};
						} else {
							console.log("Can not load: " + model_path);
						};
					};
				});

				// load css & js
				_.each(['css', 'js'], function(type) {
					_.each(config[type] || [], function(link) {
						if(link.indexOf('http://') === 0 || link.indexOf('https://') === 0) {
							if(link.indexOf('http://../') === 0) {
								link = link.replace('http://../', '/' + addon_name + '/');
							};
							def.asset.addUrl(type, link);
						} else {
							def.asset.addFile(type, path.join(addon_path, link));
						};
					});
				});

				// add to addons
				this.addons[addon_name] = addon_path;
			}, undefined, this);
		}
	};
	instance.base.addon = instance.Class.extend(_class);
};
