var path = require('path');
var ekit_dir = require('ekit-dir');

module.exports = function(instance, def, app, server, io) {
	var _class = {
		
		addons: {},

		init: function() {
			var addons = this.collect();
			addons = this.validate(addons);
			addons = this.filter_auto_install(addons);
			addons = this.build_dependency(addons);
			this.addons = addons;
			this.load(addons);
		},

		collect: function(type) {
			var res = {};
			// reset addons_path
			this.addons_path = {};
			// collect addons
			_.each([def.config.addons_path, def.config.addons_dev], function(addons_path){
				_.each(addons_path, function(addon_path) {
					_.each(ekit_dir.subdirs(path.join(def.root_path, addon_path)), function(addon_name) {
						if(res[addon_name] === undefined) {
							res[addon_name] = path.join(def.root_path, addon_path, addon_name);
						} else {
							throw 'Duplicate addon name: <' + addon_name + '> in: <' + res[addon_name] + '> & <' + path.join(def.root_path, addon_path, addon_name) + '>';
						};
					});
				});	
			});
			return res;
		},

		validate: function(addons) {
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

		filter_auto_install: function(addons) {
			res = {};
			_.each(addons, function(value, key) {
				if(require(value).config.auto_install === true) {
					res[key] = value;
				};
			});
			return res;
		},

		build_dependency: function(addons) {
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
			_.each(addons, function(addon_path, addon_name) {
				// init addon name in instance
				instance[addon_name] === undefined ? instance[addon_name] = {} : null;
				// get addon config
				var config = require(addon_path).config || {};
				// load addon model to instance
				_.each(config.model || [], function(model) {
					require(path.join(addon_path, model))(instance, def, app, server, io);
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
			});
		}
	};
	instance.base.addon = instance.Class.extend(_class);
};
