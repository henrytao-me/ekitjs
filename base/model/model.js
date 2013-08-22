var path = require('path');

module.exports = function(instance, def) {

	var __class = {
		_name: 'unknow',
		_column: {

		},
		_index: null,

		_collection: null,
		_db: null,

		init: function() {
			// support __name in each field
			var columns = _.encodeObject(this._column, '__type');
			try {
				_.each(columns, function(column, key) {
					(function(column, key) {
						var callback = arguments.callee;
						if(_.isArray(column)) {
							if(_.isObject(column[0]) && !_.isArray(column[0])) {
								_.each(column[0], function(v, k) {
									callback(column[0][k], key + '.$.' + k);
								});
							} else {
								callback(column[0], key);
							};
						} else {
							if(_.isObject(column)) {
								if(column.__type !== undefined) {
									column.__name = key;
								};
							};
						};
					})(columns[key], key);
				});
			} catch(ex) {
			};
			this._column = _.decodeObject(columns);
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
					} else if(_.isObject(value) && value.__type === undefined) {
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
			// call super
			this._super.apply(this, arguments);
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
								func: 'getCollection',
								message: 'collection is null'
							};
						};
					});
				};
			};
		},

		getDB: function() {
			this._db === null ? this._db = def.db : null;
			if(this._db === null) {
				throw {
					func: 'getDB',
					message: 'db is null'
				};
			};
			return this._db;
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

		update_validate: function(selector, document, options) {
			var log = this;
			var self = this;
			var columns = this._column;
			/*
			* fields query
			*/
			// $inc: don't need to check datatype

			// $rename: doesn't support
			if(document.$rename) {
				throw {
					msg: "ekitjs doesn't support $rename"
				};
			};

			// $setOnInsert: use on upsert, check when create

			// $set: don't know how to check datatype yet. It's too complicated. I trust you.

			// $unset: doesn't support
			if(document.$unset) {
				throw {
					msg: "ekitjs doesn't support $unset"
				};
			};

			/*
			* array query
			*/

			// $addToSet: I trust you.

			// $pop: I trust you.

			// $pullAll: I trust you.

			// $pull: I trust you.

			// $pushAll: I trust you.

			// $push: I trust you.

			return true;
		},

		create: function() {
			var log = this;
			var self = this;
			var args = _.initCallback(arguments);
			// get out callback
			var callback = args.pop();
			args.push(function(err, result) {
				callback.call(self, err, result);
			});
			// check force = true (pass the validator)
			if(args[1].force !== true){
				// validate args
				try {
					args[0] = this.create_validate(args[0]);
				} catch(ex) {
					log.log({
						func: 'create',
						args: JSON.stringify(arguments),
						ex: ex
					});
					callback.call(self, ex, null);
					return;
				};	
			};
			delete args[1].force;
			// execute
			this.getCollection(function(collection) {
				collection.insert.apply(collection, args);
			});
			return;
		},

		read: function() {
			var log = this;
			var self = this;
			var args = _.initCallback(arguments);
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
			// force
			var force = false;
			_.each(args, function(arg){
				if(_.isObject(arg) && !_.isArray(arg)){
					force = arg.force === true ? true : false;
				};
			});
			// find
			this.getCollection(function(collection) {
				collection.find.apply(collection, args).toArray(function(err, data) {
					if(err) {
						return callback.call(self, err, []);
					} else {
						// check force = true (pass all function field)
						if(force === true){
							return callback.call(self, null, data);
						};
						/*
						* init function field (store === false)
						*/
						// init loop injection
						if(self.___loop_injection === true) {
							return callback.call(self, null, data);
						};
						self.___loop_injection = true;

						// callback & reset loop_injection
						var success = function() {
							try {
								self.___loop_injection = false;
								delete self.___loop_injection;
							} catch(ex) {
							};
							callback.call(self, null, data);
						};

						// get ids
						var ids = [];
						var keyData = {};
						_.each(data, function(value) {
							ids.push(value._id);
							keyData[value._id] = value;
						});

						// get hide & show fields
						var isQueryHide = null;
						var show_fields = [];
						var hidden_fields = [];
						_.each(fields, function(value, key) {
							if(value === 0) {
								hidden_fields.push(key);
								isQueryHide = true;
							} else if(value === 1) {
								show_fields.push(key);
								isQueryHide = false;
							}
							;
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
							;
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

						if(sequence.length === 0) {
							success();
						} else {
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
					};
				});
			});
		},

		update: function() {
			var log = this;
			var self = this;
			var args = _.initCallback(arguments);
			// get out callback
			var callback = args.pop();
			args.push(function(err, result, extra) {
				if(err) {
					callback.call(self, err, 0, extra);
				} else {
					callback.call(self, null, result, extra);
				};
			});
			// init full args (4 items)
			if(args.length === 3) {
				args[3] = args[2];
				args[2] = {};
			};
			// check force = true (pass all volidator)
			if(args[2].force === true){
				// start update
				this.getCollection(function(collection) {
					collection.update.apply(collection, args);
				});
				return;
			};
			// normal update
			var func_update = function() {
				// validate args
				try {
					// remove $setOnInsert
					delete args[1].$setOnInsert;
					// start validate
					this.update_validate(args[0], args[1], args[2]);
				} catch(ex) {
					log.log({
						func: 'update',
						args: JSON.stringify(arguments),
						ex: ex
					});
					callback.call(self, ex, 0);
					return;
				};
				// start update
				this.getCollection(function(collection) {
					collection.update.apply(collection, args);
				});
			};

			// check upsert
			var upsert = args[2].upsert;
			delete args[2].upsert;
			if(upsert === true) {
				this.read(args[0], {
					_id: 1
				}, function(err, data) {
					if(data.length > 0) {
						func_update.call(self);
					} else {
						// create using $setOnInsert
						if(args[1].$setOnInsert !== undefined) {
							self.create(args[1].$setOnInsert, function(e, r) {
								if(e) {
									args[3](e, 0);
								} else {
									args[3](null, 1, r);
								};
							});
						} else {
							args[3]({
								msg: 'can not find $setOnInsert'
							}, 0);
						};
					};
				});
			} else {
				func_update.call(self);
			};
			return;
		},

		'delete': function() {
			var log = this;
			var self = this;
			var args = _.initCallback(arguments);
			// get out callback
			var callback = args.pop();
			args.push(function(err, result) {
				callback.call(self, err, result);
			});
			// delete
			this.getCollection(function(collection) {
				collection.remove.apply(collection, args);
			});
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
