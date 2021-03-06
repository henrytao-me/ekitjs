var ObjectId = require('mongodb').ObjectID;

/*
 * Init type
 * core type: auto, id, func, object, array, many2one, one2many
 * need to support: string, number, date, datetime, boolean, selection
 */

instance.base.type = {};

// type: auto
instance.base.type.auto = Class.extend({

	opt: {},

	init: function(opt) {
		var self = this;
		opt === undefined ? opt = {} : null;
		// init default value
		_.mixObject(opt, {
			require: false,
			def: undefined,
			prefix: undefined
		});
		// init prefix
		opt.validate = (function(validate) {
			if(!_.isFunction(validate)) {
				validate = function(data) {
					return this._super(data);
				};
			};
			return function(data) {
				data = validate.call(this, data);
				if(opt.prefix !== undefined) {
					data = opt.prefix + data;
				};
				return data;
			};
		})(opt.validate);
		// init extend validate
		if(_.isFunction(opt.validate)) {
			this.validate = (function(validate) {
				return function(data) {
					return opt.validate.call({
						_super: function(data) {
							return validate.call(self, data);
						}
					}, data);
				};
			})(this.validate);
		};
		// return
		this.opt = opt;
	},

	get: function(key) {
		return this.opt[key];
	},

	require: function(data) {// check require value & default value
		if(this.get('require') === true && data === undefined) {
			if(this.get('def') === undefined) {
				throw {
					msg: 'require value',
					field: this.__name,
					define_type: this.__type,
					input_data: data
				};
			} else {
				if(_.isFunction(this.get('def'))) {
					data = this.get('def').call(this);
				} else {
					data = this.get('def');
				};
			};
		};
		return data;
	},

	validate: function(data) {// check data type
		return data;
	}
});

instance.base.type.id = instance.base.type.auto.extend({

	init: function(opt) {
		var self = this;
		opt === undefined ? opt = {} : null;
		opt.def = function() {
			return (new ObjectId()).toString();
		};
		opt.require = true;
		this._super(opt);
	},

	validate: function(data) {
		data ? data = data.toString() : null;
		return data;
	}
});

// type: func
instance.base.type.func = instance.base.type.auto.extend({

	init: function(opt) {
		opt === undefined ? opt = {} : null;
		_.mixObject(opt, {
			multi: false,
			store: false,
			sequence: 10,
			get: function(ids, data, callback) {
			}
		});
		opt.require = false;
		opt.def = undefined;
		opt.prefix = undefined;
		this._super(opt);
	},

	get: function(key) {
		switch(key) {
		case 'require':
			return false;
		default:
			return this._super.apply(this, arguments);
		};
	},

	require: function(data) {
		return undefined;
	},

	validate: function(data) {
		if(this.get('store') === false) {
			return undefined;
		}
		return data;
	}
});

// type: many2one. Don't need to check exist
instance.base.type.many2one = instance.base.type.auto.extend({

	init: function(opt) {
		opt === undefined ? opt = {} : null;
		_.mixObject(opt, {
			model: null,
			key: '_id'
		});
		this._super(opt);
	}
});

// type: one2many
instance.base.type.one2many = instance.base.type.func.extend({

	__type: 'func',

	init: function(opt) {
		opt === undefined ? opt = {} : null;
		_.mixObject(opt, {
			model: null,
			key: '_id',
			ref: null
		});
		if(!opt.model || !opt.ref) {
			console.log('------------------------------------------------------------------');
			console.log({
				msg: 'one2many need: model & ref',
				model: opt.model
			});
			console.log('------------------------------------------------------------------');
			this.__type = 'auto';
			return;
		};
		var one2many = this;
		opt.get = function(ids, callback) {
			var self = this;
			var column = _.encodeObject(ekitjs.pool(one2many.get('model'))._column, '__class');
			var ref = column[one2many.get('ref')];
			var res = {};
			this.read({
				_id: {
					$in: ids
				}
			}, {
				fields: (function() {
					var res = {};
					res[one2many.get('key')] = 1;
					return res;
				})(),
			}, function(e, docs) {
				if(e || docs.length === 0) {
					return callback(res);
				};
				// init success callback
				var success = _.success(docs.length, function() {
					callback(res);
				});
				// start find children
				_.each(docs, function(doc) {
					res[doc._id] = [];
					(function(id) {
						self.pool(one2many.get('model')).read((function() {
							var res = {};
							res[one2many.get('ref')] = id;
							return res;
						})(), {
							fields: (function() {
								var res = {};
								res[one2many.get('key')] = 1;
								return res;
							})()
						}, function(e, children) {
							_.each(children, function(child) {
								res[doc._id].push(child[one2many.get('key')]);
							});
							success.success();
						});
					})(doc[one2many.get('key')]);
				});
			});
		};
		// store
		// opt.store = (function(){
			// var res = {};
			// res[opt.model] = {
				// column: ['_id', opt.key, opt.ref],
				// sequence: 10,
				// callback: function(ids, callback) {
					// var column = _.encodeObject(ekitjs.pool(one2many.get('model'))._column, '__class');
					// var ref = column[one2many.get('ref')];
					// this.read({
						// _id: {
							// $in: ids
						// }
					// }, {
						// fields: (function(){
							// var res = {};
							// res[ref.get('key')] = 1;
							// return res;
						// })()
					// }, function(e, docs){
						// var tmp = [];
						// _.each(docs, function(doc){
							// tmp.push(doc._id);
						// });
						// callback(tmp);
					// });
				// }
			// };
			// return res;
		// })();
		// call super
		this._super(opt);
	}
});

// type: object
instance.base.type.object = instance.base.type.auto.extend({

	init: function(_column) {
		// set column
		this._column = _column === undefined ? {} : _column;
		// init opt
		this._super();
	},

	require: function(data) {
		data === undefined ? data = {} : null;
		_.each(this._column, function(column, name) {
			data[name] = column.require(data[name]);
			data[name] === undefined ?
			delete data[name] : null;
		});
		return data;
	},

	validate: function(data) {
		data === undefined ? data = {} : null;
		if(!_.isObject(data, true)) {
			throw {
				msg: 'validate value',
				field: this.__name,
				define_type: this.__type,
				input_data: data
			};
		};
		_.each(this._column, function(column, name) {
			data[name] = column.validate(data[name]);
			data[name] === undefined ?
			delete data[name] : null;
		});
		return data;
	},

	getFuncField: function() {
		var funcs = {};
		_.each(this._column, function(column, name) {
			switch(column.__type) {
			case 'func':
				funcs[name] = column;
				break;
			case 'object':
				funcs[name] = column.getFuncField();
				break;
			};
		});
		return funcs;
	}
});

// type: array
instance.base.type.array = instance.base.type.auto.extend({

	init: function(_element) {
		// set column
		this._element = _element === undefined ? {} : _element;
		// init opt
		this._super();
	},

	require: function(data, isElement) {
		var self = this;
		isElement === undefined ? isElement = true : false;
		if(isElement === true) {
			data = self._element.require(data);
		} else {
			data === undefined ? data = [] : null;
			if(!_.isArray(data)) {
				throw {
					msg: 'validate array stucture',
					field: this.__name,
					define_type: this.__type,
					input_data: data
				};
			};
			_.each(data, function(v, k) {
				data[k] = self._element.require(v);
			});
		};
		return data;
	},

	validate: function(data, isElement) {
		var self = this;
		isElement === undefined ? isElement = true : false;
		if(isElement === true) {
			data = self._element.validate(data);
		} else {
			data === undefined ? data = [] : null;
			if(!_.isArray(data)) {
				throw {
					msg: 'validate array stucture',
					field: this.__name,
					define_type: this.__type,
					input_data: data
				};
			};
			_.each(data, function(v, k) {
				data[k] = self._element.validate(v);
			});
		};
		return data;
	}
});
