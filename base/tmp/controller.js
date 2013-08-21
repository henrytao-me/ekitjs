var path = require('path');

module.exports = function(instance) {
	var app = instance.base.base.extend({
		__data: {
			'get': {},
			'post': {},
			'put': {},
			'delete': {}
		},
		__export_routing: function(self) {
			var res = {};
			var _this = this;
			self = typeof self !== 'undefined' ? self : _this;
			for(var type in _this._data) {
				res[type] = res[type] ? res[type] : [];
				for(var i in _this._data[type]) {
					var req = _this._data[type][i].req;
					var callback = _this._data[type][i].callback;
					// push method
					res[type].push({
						req: req,
						callback: (function(self, callback) {
							return function(req, res, next) {
								callback.call(self, req, res, next);
							};
						})(self, callback)
					});
				};
			};
			return res;
		},
		__method: function(type, req, callback, force) {
			var log = this;
			// standardized req
			var std_req = this.__std_req(req);
			// check existing request & force
			if(this.__data[type][std_req] && force !== true) {
				log.log({
					msg: 'request already exists',
					data: {
						type: type,
						req: req,
						force: force
					}
				});
				return false;
			};
			// add req
			this.__data[type][std_req] = {
				req: req,
				callback: callback
			};
			return true;
		},
		__std_req: function(req) {//standardized request
			var res = [];
			_.each(req.split('/'), function(value) {
				if(value.indexOf(':') < 0) {
					res.push(value);
				} else {
					res.push('*');
				};
			});
			return res.join('/');
		},
		'get': function(req, callback, force) {
			return this.__method('get', req, callback, force);
		},
		'post': function(req, callback, force) {
			return this.__method('post', req, callback, force);
		},
		'put': function(req, callback, force) {
			return this.__method('put', req, callback, force);
		},
		'delete': function(req, callback, force) {
			return this.__method('delete', req, callback, force);
		}
	});

	var __class = {
		app: new app(),
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
	
	
	
	instance.test = instance.base.controller.extend({
		'get://a/b/:a/c': function(){
			
		}
	});

};
