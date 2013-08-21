var path = require('path');

module.exports = function(instance) {

	var __class = {
		_name: 'unknow',
		_column: {

		},
		_index: null,

		_collection: null,
		_column: null,
		_db: null,

		init: function() {
			// re-init column
			this._initColumn();
			// call super
			this._super.apply(this, arguments);
		},

		_initColumn: function() {
			try {
				var tmp = {};
				var callback = function(res, value) {
					var args = arguments;
					var tmp = value;
					if(_.isArray(value)) {
						var a = {
							res: value[0]
						};
						args.callee(a, value[0]);
						tmp = instance.base.types.array(a['res']);
					} else if(_.isObject(value) && value.__type === undefined) {
						_.each(tmp, function(v, k) {
							var a = {
								res: v
							};
							args.callee(a, v);
							tmp[k] = a.res;
						});
						tmp = instance.base.types.object(tmp);
					}
					res.res = tmp;
				};
				_.each(this._column, function(value, key) {
					var res = {
						res: value
					};
					callback(res, value);
					tmp[key] = res.res;
				});
				this._column = tmp;
			} catch(ex) {
				throw ex;
			};
		},

		_checkCallback: function(args) {
			var res = [];
			try {
				var is_func = false;
				for(var i in args) {
					res.push(args[i]);
					if( typeof args[i] === 'function') {
						is_func = true;
					};
				};
				if(is_func === false) {
					res.push(function() {
					});
				};
			} catch(ex) {
				return null;
			};
			return res;
		},

		getCollection: function(callback) {
			var log = this;

			if(this.__collection !== null) {
				callback(this.__collection);
			} else {
				if(this.getDB()) {
					this.getDB().collection(this._name, function(err, collection) {
						if(!err) {
							this.__collection = collection;
							callback(this.__collection);
						} else {
							log.log({
								func: 'getCollection',
								message: 'collection is null'
							});
						};
					});
				} else {
					log.log({
						func: 'getCollection',
						message: 'db is null'
					});
				};
			};
		},

		getDB: function() {
			return this.__db === null ? this.__db = instance._config.db : this.__db;
		},

		create_validate: function(args) {
			// check default & require value
			_.each(this._column, function(column, name) {
				args[name] = column.validate(args[name]);
			});
			// remove all undefined property
			_.each(args, function(value, key) {
				if(value === undefined) {
					delete args[key];
				};
			});
			// return
			return args;
		},

		_rebuild_key_value: function(key, value) {
			var res = {};
			var keys = key.split('.');
			(function(res, keys, value) {
				if(keys.length === 1) {// object
					res[keys[0]] = value;
					return;
				};
				if(keys.length === 0) {// array
					res.push(value);
					return;
				};
				// check array
				if(!isNaN(keys[1]) || keys[1] === '$') {
					if(keys[2] === undefined) {
						var a = [];
						var b = keys.slice(2);
						arguments.callee(a, b, value);
						res[keys[0]] = a;
					} else {
						var a = {};
						var b = keys.slice(2);
						arguments.callee(a, b, value);
						res[keys[0]] = [a];
					};
				} else {
					var a = {};
					var b = keys.slice(1);
					arguments.callee(a, b, value);
					res[keys[0]] = a;
				};
			})(res, keys, value);
			return res;
		},

		update_validate: function(selector, document, options) {
			var log = this;
			var self = this;
			var set = document.$set;
			var push = document.$push;
			var columns = this._column;
			_.isObject(options) ? null : options = {};
			try {
				// set
				if(_.isObject(set)) {
					_.each(set, function(value, key) {
						// rebuild key
						var docs = self._rebuild_key_value(key, value);
						// check validation
						_.each(docs, function(data, name) {
							if(columns[name] !== undefined) {
								if(columns[name].checkDataType(data) !== true) {
									throw {
										msg: 'invalid datatype',
										type: columns[name].__type,
										data: docs
									};
								};
							};
						});
					});
				};
				// push
				if(_.isObject(push)) {
					_.each(push, function(value, key) {
						// rebuild key
						var docs = self._rebuild_key_value([key, '$'].join('.'), value);
						// check validation
						_.each(docs, function(data, name) {
							if(columns[name] !== undefined) {
								if(columns[name].checkDataType(data) !== true) {
									throw {
										msg: 'invalid datatype',
										type: columns[name].__type,
										data: docs
									};
								};
							};
						});
					});
				};
			} catch(ex) {
				throw ex;
				// log.log({
				// func: 'update_validate',
				// msg: 'invalid input',
				// e: JSON.stringify(arguments),
				// ex: ex
				// });
				return false;
			}
			return true;
		},

		create: function() {
			var log = this;
			var self = this;
			var args = this._checkCallback(arguments);
			// get out callback
			var callback = args.pop();
			args.push(function(err, result) {
				if(err) {
					callback.call(self, null);
				} else {
					callback.call(self, result);
				};
			});
			// validate args
			try {
				args[0] = this.create_validate(args[0]);
			} catch(ex) {
				log.log({
					func: 'create',
					data: JSON.stringify(arguments),
					ex: ex
				});
				return false;
			};
			// execute
			this.getCollection(function(collection) {
				collection.insert.apply(collection, args);
			});
			return true;
		},

		read: function() {
			var log = this;
			var self = this;
			var args = this._checkCallback(arguments);
			// get out callback
			var callback = args.pop();
			// remove disable _id field
			var fields = {};
			_.each(args, function(value, key, l, opt) {
				if(opt.index === 0) {
					return;
				};
				if(value.fields !== undefined) {
					if(value.fields._id !== undefined) {
						delete args[key].fields._id;
					};
					fields = args[key].fields;
				};
			});
			// find
			this.getCollection(function(collection) {
				collection.find.apply(collection, args).toArray(function(err, data) {
					if(err) {
						return callback.call(self, null);
					} else {
						/*
						* init function field (store === false)
						*/
						// init loop injection
						if(self.___loop_injection === true) {
							return callback.call(self, data);
						};
						self.___loop_injection = true;

						// callback & reset loop_injection
						var success = function() {
							self.___loop_injection = false;
							callback.call(self, data);
						};

						// get ids
						var ids = [];
						var keyData = {};
						_.each(data, function(value) {
							ids.push(value._id);
							keyData[value._id] = value;
						});

						// get hide fields
						var hidden_fields = [];
						_.each(fields, function(value, key) {
							if(value === 0) {
								hidden_fields.push(key);
							};
						});

						// filter function fields in column with hidden fields
						var funcs = {};
						_.each(self._column, function(column, name) {
							switch(column.__type) {
							case 'func':
								funcs[name] = column;
								break;
							case 'object':
								funcs[name] = column.getFuncField();
								break;
							};
						});
						funcs = _.encodeObject(funcs, '__type');
						_.each(funcs, function(value, key) {
							// just keep function with store === false
							if(value.get('store') !== false) {
								delete funcs[key];
								return;
							};
							_.each(hidden_fields, function(field) {
								if(key.indexOf(field) === 0) {
									delete funcs[key];
								}
							});
						});

						// sort funcs by sequence
						_.sortObject(funcs, function(a, b) {
							return a.get('sequence') - b.get('sequence');
						});

						// rebuild function fields sequence
						var sequence = [];
						_.each(funcs, function(func, key, l, opt) {
							sequence.push((function(func, key, opt) {
								return function(fcb) {
									func.get('get').call(self, ids, keyData, function(funcData) {
										_.each(funcData, function(fData, _id) {
											var tmp = {};
											if(func.get('multi') === true) {
												tmp[key] = fData[key];
											} else {
												tmp[key] = fData;
											};
											_.setObject(keyData[_id], tmp);
										});
										data = _.values(keyData);
										// callback & reset loop_injection
										if(opt.isLast === true) {
											success();
										};
										fcb();
									});
								};
							})(func, key, opt));
						});
						(function(sequence) {
							var args = arguments;
							if(sequence.length === 0) {
								return;
							};
							var func = sequence.shift();
							func(function() {
								args.callee(sequence);
							});
						})(sequence);
					};
				});
			});
		},

		update: function() {
			var log = this;
			var self = this;
			var args = this._checkCallback(arguments);
			// get out callback
			var callback = args.pop();
			args.push(function(err, result) {
				if(err) {
					callback.call(self, null);
				} else {
					callback.call(self, result);
				};
			});
			// init full args
			_.isFunction(args[3]) ? null : args[3] = args[2];
			_.isFunction(args[2]) ? args[2] = {} : null;
			// remove upsert
			if(args[2].upsert === true) {
				log.log({
					msg: "do not allow upsert yet"
				});
			};
			args[2].upsert = false;
			// validate args
			// validate args
			try {
				if(this.update_validate(args[0], args[1], args[2]) !== true) {
					return false;
				};
			} catch(ex) {
				log.log({
					func: 'update',
					data: JSON.stringify(arguments),
					ex: ex
				});
				return false;
			};
			// update
			this.getCollection(function(collection) {
				collection.update.apply(collection, args);
			});
			return true;
		},

		'delete': function() {
			var log = this;
			var self = this;
			var args = this._checkCallback(arguments);
			// get out callback
			var callback = args.pop();
			args.push(function(err, result) {
				if(err) {
					callback.call(self, null);
				} else {
					callback.call(self, result);
				};
			});
			// delete
			this.getCollection(function(collection) {
				collection.remove.apply(collection, args);
			});
			return true;
		}
	};

	instance.base.model = instance.base.base.extend(__class);

	// config model static type
	instance.base.model.__type = 'model';
	instance.base.model.__extend = instance.base.model.extend;
	instance.base.model.extend = function() {
		var res = instance.base.model.__extend.apply(instance.base.model, arguments);
		res.__type = instance.base.model.__type;
		return res;
	};
};
