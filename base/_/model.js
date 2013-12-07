var ObjectId = require('mongodb').ObjectID;
var backupModel = {};

var __class = {
	_name: 'unknow',
	_column: {

	},
	_index: null,

	_collection: null,
	_db: null,

	init: function() {
		this.initColumn();
	},

	initColumn: function() {
		// check cache exists
		if(backupModel[this.__name]) {
			this._column = backupModel[this.__name];
			return;
		};
		// init column
		// re-init column, support quick define: {}: object datatype, []: array datatype
		try {
			var tmp = {};
			var callback = function(res, value, key) {
				var args = arguments;
				var tmp = value;
				if(_.isArray(value)) {
					var a = {
						res: value[0]
					};
					args.callee(a, value[0], key + '.$');
					tmp = instance.base.types.array(a['res']);
					tmp.__name = key + '.$';
				} else if(_.isObject(value, true) && value.__class !== true) {
					_.each(tmp, function(v, k) {
						var a = {
							res: v
						};
						args.callee(a, v, key + '.' + k);
						tmp[k] = a.res;
					});
					tmp = instance.base.types.object(tmp);
					tmp.__name = key;
				}
				tmp.__name = key;
				res.res = tmp;
			};
			_.each(this._column, function(value, key) {
				var res = {
					res: value
				};
				callback(res, value, key);
				tmp[key] = res.res;
			});
			this._column = tmp;
		} catch(ex) {
			throw ex;
		};
		// cache column
		backupModel[this.__name] = this._column;
	},

	getCollection: function(callback) {
		var log = this;
		if(this._collection) {
			callback(this._collection);
		} else {
			if(this.getDB()) {
				this.getDB().collection(this._name, function(err, collection) {
					if(!err) {
						this._collection = collection;
						callback(this._collection);
					} else {
						throw {
							status: 'init',
							func: 'getCollection',
							message: 'collection is null'
						};
					};
				});
			};
		};
	},

	getDB: function() {
		this._db === null ? this._db = ekitjs.db : null;
		if(this._db === null) {
			throw {
				status: 'init',
				func: 'getDB',
				message: 'db is null'
			};
		};
		return this._db;
	},

	createValidate: function(args) {
		// check default & require value
		_.each(this._column, function(column, name) {
			if(column.__type === 'array') {
				args[name] = column.require(args[name], false);
				args[name] = column.validate(args[name], false);
			} else {
				args[name] = column.require(args[name]);
				args[name] = column.validate(args[name]);
			};
		});
		// remove all undefined property
		_.each(args, function(value, key) {
			value === undefined ?
			delete args[key] : null;
		});
		// return
		return args;
	},

	checkUpdateKey: function(key) {
		var res = null;
		var keys = [];
		_.each(key.split('.'), function(v) {
			if(v === '$') {
				var tmp = keys.pop();
				tmp = [tmp, '$'].join('.');
				keys.push(tmp);
			} else {
				keys.push(v);
			};
		});
		(function(column, keys, obj) {
			var k = keys.shift();
			if(k === undefined) {
				res = obj;
				return;
			};
			var isArray = false;
			if(k.indexOf('.$') >= 0) {
				isArray = true;
				k = k.replace('.$', '');
			};
			if(column[k] === undefined) {
				return;
			} else {
				if((column[k].__type !== 'array' && isArray === true)) {
					throw {
						msg: 'invalid structure',
						field: column[k].__name,
						type: column[k].__type,
						input_key: key
					};
				};
				switch(column[k].__type) {
				case 'object':
					arguments.callee(column[k]._column, keys, column[k]);
					break;
				case 'array':
					arguments.callee(column[k]._element, keys, column[k]);
					break;
				case 'auto':
					res = column[k];
					break;
				default:
					res = column[k];
					// throw {
					// msg: 'invalid structure',
					// field: column[k].__name,
					// type: column[k].__type,
					// input_key: key,
					// };
					break;
				};
			};
		})(this._column, keys, null);
		return res
	},

	updateValidate: function(args) {
		var log = this;
		var self = this;
		var columns = this._column;

		var supportList = ['$inc', '$rename', '$setOnInsert', '$set', '$unset', '$addToSet', '$pop', '$pullAll', '$pull', '$pushAll', '$push'];
		_.each(args, function(v, key) {
			if(supportList.indexOf(key) < 0) {
				throw {
					msg: "ekitjs doesn't support " + key
				};
			};
		});

		/*
		* fields query
		*/
		// $inc: don't need to check datatype

		// $rename: doesn't support
		if(args.$rename) {
			throw {
				msg: "ekitjs doesn't support $rename"
			};
		};

		// $setOnInsert: use on upsert, check update function

		// $set: check object update and $ for array
		if(args.$set) {
			_.each(args.$set, function(value, key) {
				var column = this.checkUpdateKey(key);
				if(column !== null) {
					args.$set[key] = column.validate(value);
				};
			}, undefined, this);
		};

		// $unset: doesn't support
		if(args.$unset) {
			throw {
				msg: "ekitjs doesn't support $unset"
			};
		};

		/*
		* array query
		*/

		// $addToSet:
		if(args.$addToSet) {
			_.each(args.$addToSet, function(value, key) {
				var column = this.checkUpdateKey(key);
				if(column !== null) {
					if(column.__type !== 'array') {
						throw {
							msg: '$addToSet not an array field',
							field: column.__name,
							type: column.__type,
							input_key: key,
						};
					};
					// check multi input with $each
					var isEach = false;
					if(_.isObject(value, true)) {
						if(value.$each !== undefined) {
							isEach = true;
						};
					};
					if(isEach === true) {
						_.each(value.$each, function(v, k) {
							args.$addToSet[key].$each[k] = column.validate(v);
						});
					} else {
						args.$addToSet[key] = column.validate(value);
					};
				};
			}, undefined, this);
		};

		// $pop
		if(args.$pop) {
			_.each(args.$pop, function(value, key) {
				var column = this.checkUpdateKey(key);
				if(column !== null) {
					if(column.__type !== 'array') {
						throw {
							msg: '$pop not an array field',
							field: column.__name,
							type: column.__type,
							input_key: key,
						};
					};
				};
			}, undefined, this);
		};

		// $pullAll
		if(args.$pullAll) {
			_.each(args.$pullAll, function(value, key) {
				var column = this.checkUpdateKey(key);
				if(column !== null) {
					if(column.__type !== 'array') {
						throw {
							msg: '$pullAll not an array field',
							field: column.__name,
							type: column.__type,
							input_key: key,
						};
					};
					_.each(value, function(v, k) {
						args.$pullAll[key][k] = column.validate(v);
					});
				};
			}, undefined, this);
		};

		// $pull
		if(args.$pull) {
			_.each(args.$pull, function(value, key) {
				var column = this.checkUpdateKey(key);
				if(column !== null) {
					if(column.__type !== 'array') {
						throw {
							msg: '$pull not an array field',
							field: column.__name,
							type: column.__type,
							input_key: key,
						};
					};
					args.$pull[key] = column.validate(value);
				};
			}, undefined, this);
		};

		// $pushAll
		if(args.$pushAll) {
			_.each(args.$pushAll, function(value, key) {
				var column = this.checkUpdateKey(key);
				if(column !== null) {
					if(column.__type !== 'array') {
						throw {
							msg: '$pushAll not an array field',
							field: column.__name,
							type: column.__type,
							input_key: key,
						};
					};
					_.each(value, function(v, k) {
						args.$pushAll[key][k] = column.validate(v);
					});
				};
			}, undefined, this);
		};

		// $push
		if(args.$push) {
			_.each(args.$push, function(value, key) {
				var column = this.checkUpdateKey(key);
				if(column !== null) {
					if(column.__type !== 'array') {
						throw {
							msg: '$push not an array field',
							field: column.__name,
							type: column.__type,
							input_key: key,
						};
					};
					// check multi input with $each
					var isEach = false;
					if(_.isObject(value, true)) {
						if(value.$each !== undefined) {
							isEach = true;
						};
					};
					if(isEach === true) {
						_.each(value.$each, function(v, k) {
							args.$push[key].$each[k] = column.validate(v);
						});
					} else {
						args.$push[key] = column.validate(value);
					};
				};
			}, undefined, this);
		};
		return args;
	},

	create: function(docs, options, callback) {
		var log = this;
		var self = this;
		var args = _.initCallback(arguments);
		// init
		var _callback = args.pop();
		docs = args[0] || {};
		options = args[1] || {};
		// force
		var force = options.force === undefined ? false : options.force;
		delete options.force;
		// trigger
		var trigger = options.trigger === undefined ? true : options.trigger;
		delete options.trigger;
		// callback
		callback = function(err, result) {
			var ids = [];
			if(!err) {
				_.each(result, function(item) {
					ids.push(item._id);
				});
			};
			if(trigger === true && force !== true) {
				self.createTrigger(ids, [docs, options], function() {
					_callback.call(self, err, ids);
				});
			} else {
				_callback.call(self, err, ids);
			};
		};
		// check createValidate
		if(force !== true) {
			try {
				docs = this.createValidate(docs);
			} catch(e) {
				log.log({
					func: 'create',
					args: JSON.stringify([docs, options]),
					e: e
				});
				return callback.call(self, e, null);
			};
		};
		// execute
		this.getCollection(function(collection) {
			collection.insert(docs, options, callback);
		});
		console.log('create on', this.__name);
	},

	read: function(selector, options, callback) {
		var log = this;
		var self = this;
		var args = _.initCallback(arguments);
		// get out callback
		callback = args.pop();
		selector = args[0] || {};
		options = args[1] || {};
		// force
		var force = options.force === undefined ? false : options.force;
		delete options.force;
		// remove fields._id in options if _id: 0
		if(_.isObject(options.fields, true)) {
			if(options.fields._id === 0) {
				delete options.fields._id;
			};
		};
		// check _id field in selector
		if(selector._id) {
			if(_.isString(selector._id)) {
				selector._id = {
					$in: [selector._id]
				};
			};
			_.each(selector._id['$in'], function(_id, i) {
				_.isString(_id) ? selector._id['$in'][i] = new ObjectId(_id) : null;
			});
		};
		// find
		this.getCollection(function(collection) {
			collection.find(selector, options).toArray(function(e, docs) {
				if(e || force === true || self.__context.loop_injection === true) {
					return callback.call(self, e, docs);
				};

				/*
				 *
				 * check function fields: store === false
				 *
				 */

				self.__context.loop_injection = true;
				var success = function() {
					self.__context.loop_injection = false;
					callback.call(self, e, docs);
				};

				// get ids
				var ids = [];
				var docsKey = {};
				_.each(docs, function(doc) {
					ids.push(doc._id);
					docsKey[doc._id] = doc;
				});

				// get hide & show fields
				var isQueryHide = null;
				var show_fields = [];
				var hidden_fields = [];
				_.each(options.fields, function(value, key) {
					if(value === 0) {
						hidden_fields.push(key);
						isQueryHide = true;
					} else if(value === 1) {
						show_fields.push(key);
						isQueryHide = false;
					}
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
				funcs = _.encodeObject(funcs, '__class');
				_.each(funcs, function(func, key) {
					// just keep function with store === false
					if(func.get('store') !== false) {
						delete funcs[key];
						return;
					};
					if(isQueryHide === true) {
						// remove function field in hidden_fields
						_.each(hidden_fields, function(field) {
							if(key.indexOf(field) === 0) {
								delete funcs[key];
							}
						});
					} else if(isQueryHide === false) {
						// remove function field not in show_fields
						var isIn = false;
						_.each(show_fields, function(field) {
							if(key.indexOf(field) === 0) {
								isIn = true;
							};
						});
						if(!isIn) {
							delete funcs[key];
						};
					}
				});
				// sort funcs by sequence
				_.sortObject(funcs, function(a, b) {
					return a.get('sequence') - b.get('sequence');
				});
				// rebuild function fields sequence
				var sequence = [];
				_.each(funcs, function(func, key) {
					sequence.push((function(func, key) {
						return function(callback) {
							func.get('get').call(self, ids, function(data) {
								_.each(data, function(value, _id) {
									var tmp = {};
									if(func.get('multi') === true) {
										tmp[key] = value[key];
									} else {
										tmp[key] = value;
									};
									_.setObject(docsKey[_id], tmp, true);
								});
								callback();
							});
						};
					})(func, key));
				});
				_.sequence(sequence, function() {
					docs = _.values(docsKey);
					success();
				});
			});
		});
		console.log('read on', this.__name);
	},

	update: function(selector, document, options, callback) {
		var log = this;
		var self = this;
		var args = _.initCallback(arguments);
		// get out callback
		var callback = args.pop();
		selector = args[0] || {};
		document = args[1] || {};
		options = args[2] || {};
		// trigger
		var trigger = options.trigger === undefined ? true : options.trigger;
		delete options.trigger;
		// force
		var force = options.force === undefined ? false : options.force;
		delete options.force;
		if(force === true) {
			// start update
			return this.getCollection(function(collection) {
				collection.update(selector, document, options, callback);
			});
		};
		// check upsert
		var upsert = options.upsert;
		delete options.upsert;
		// check _id field in selector
		if(selector._id) {
			if(_.isString(selector._id)) {
				selector._id = {
					$in: [selector._id]
				};
			};
			_.each(selector._id['$in'], function(_id, i) {
				_.isString(_id) ? selector._id['$in'][i] = new ObjectId(_id) : null;
			});
		};
		// normal update
		var func_update = function() {
			// validate args
			try {
				// remove $setOnInsert
				delete document.$setOnInsert;
				// start validate
				document = this.updateValidate(document);
			} catch(e) {
				log.log({
					func: 'update',
					args: JSON.stringify([selector, document, options]),
					e: e
				});
				return callback.call(self, e, null);
			};
			// start update
			this.getCollection(function(collection) {
				var _callback = callback;
				callback = function(err, result) {
					var ids = [];
					if(!err) {
						// get update id
						self.read(selector, {
							fields: {
								_id: 1
							}
						}, function(e, docs) {
							_.each(docs, function(item) {
								ids.push(item._id);
							});
							if(trigger === true) {
								self.updateTrigger(ids, [selector, document, options], function() {
									_callback.call(self, err, ids);
								});
							} else {
								_callback.call(self, err, ids);
							};
						});
					} else {
						_callback.call(self, err, ids);
					};
				};
				collection.update(selector, document, options, callback);
			});
		};
		/*
		 * start update
		 */
		if(upsert === true) {
			this.read(selector, {
				_id: 1
			}, function(err, data) {
				data = data || [];
				if(data.length > 0) {
					func_update.call(self);
				} else {
					// create using $setOnInsert
					var setOnInsert = document.$setOnInsert || {};
					self.create(setOnInsert, callback);
				};
			});
		} else {
			func_update.call(self);
		};
		console.log('update on', this.__name)
	},

	'delete': function(selector, options, calback) {
		var log = this;
		var self = this;
		var args = _.initCallback(arguments);
		// get out callback
		callback = args.pop();
		selector = args[0] || {};
		options = args[1] || {};
		// trigger
		var trigger = options.trigger === undefined ? true : options.trigger;
		delete options.trigger;
		// force
		var force = options.force === undefined ? false : options.force;
		delete options.force;
		// check _id field in selector
		if(selector._id) {
			if(_.isString(selector._id)) {
				selector._id = {
					$in: [selector._id]
				};
			};
			_.each(selector._id['$in'], function(_id, i) {
				_.isString(_id) ? selector._id['$in'][i] = new ObjectId(_id) : null;
			});
		};
		var ids = [];
		// find out ids before delete
		this.read(selector, {
			_id: 1
		}, function(e, data) {
			_.each(data, function(item) {
				ids.push(item._id);
			});
			// get out callback
			var _callback = callback;
			callback = function(err, result) {
				_callback.call(self, err, ids);
			};
			if(trigger === true) {
				self.deleteTrigger(ids, [selector, options], function() {
					self.getCollection(function(collection) {
						collection.remove(selector, options, callback);
					});
				});
			} else {
				self.getCollection(function(collection) {
					collection.remove(selector, options, callback);
				});
			};
		});
		console.log('delete on', this.__name)
	},

	createTrigger: function(ids, args, callback) {
		callback();
	},

	updateTrigger: function(ids, args, callback) {
		callback();
	},

	deleteTrigger: function(ids, args, callback) {
		callback();
	}
	
};

GLOBAL.Model = instance.base.model = instance.base.base.extend(__class);

// config model static type
instance.base.model.__type = 'model';
instance.base.model.__extend = instance.base.model.extend;
instance.base.model.extend = function() {
	var res = instance.base.model.__extend.apply(instance.base.model, arguments);
	res.__type = instance.base.model.__type;
	return res;
};
