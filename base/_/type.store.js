/*
 * store template:
 * store = true
 * store = {
 * 	  'leaderboard.model.player': {
 * 		column: ['name'], // list of column name want to watch
 * 		sequence: 10,
 * 		callback: function(ids, opt, callback){
 * 			callback(ids);
 * 		}
 *    }
 * }
 */

var triggerCollection = {};

instance.base.cFuncStore = instance.base.controller.extend({
	init: function() {
		var self = this;
		// get all model
		_.each(_.encodeObject(instance, '__class'), function(modelClass, key) {
			if(modelClass.__type !== 'model') {
				return;
			};
			// init model, match all _column change by using include method
			var model = new modelClass();
			// get all function having trigger
			_.each(_.encodeObject(model.___column, '__class'), function(column, name) {
				// check function field having store !== false
				if(column.__type !== 'func' || column.get('store') === false) {
					return;
				};
				// get all trigger
				_.each(column.get('store'), function(trigger, modelName) {
					triggerCollection[modelName] = triggerCollection[modelName] || [];
					trigger.self = column;
					trigger.updateObj = model;
					triggerCollection[modelName].push(trigger);
				});
			});
		});
		// sort trigger by sequence
		_.each(triggerCollection, function(triggers, model) {
			_.sortObject(triggers, function(a, b) {
				return (a.sequence || 10) - (b.sequence || 10);
			});
		});

		setTimeout(function() {
			
			return;
			
			self.pool('model.document').update({
				_id: '5229aa9f59bd94b10e000001'
			}, {
				$set: {
					'abc': ['5229aa9f59bd94b10e000001']
				}
			}, function(e, data){
				console.log(e, data);
			});			
			
			return;
			
			self.pool('sample1.model.user')['delete']({
				_id: '5229894651328ee30b000001'
			});
			
			return;

			self.pool('sample1.model.user').update({
				_id: '5229894651328ee30b000001'
			}, {
				$set: {
					'name.first': 'Henry',
					'name.last': 'Tao'
				}
			});

			return;

			self.pool('sample1.model.user').read({
				_id: '5229894651328ee30b000001'
			}, function(e, data) {
				console.log(data);
			});

			return;

			self.pool('sample1.model.user').create({
				name: {
					first: 'First',
					last: 'Last'
				}
			});
		}, 800);
	},
});

var triggerFunc = function(ids, fields) {
	var self = this;
	// start trigger
	_.each(triggerCollection[this.__name], function(trigger) {
		var func = trigger.self;
		var updateObj = trigger.updateObj;
		// check column before trigger
		if(fields.indexOf('_id') < 0) {
			var isReturn = true;
			_.each(fields, function(field) {
				if(trigger.column.indexOf(field) >= 0) {
					isReturn = false;
				};
			});
			if(isReturn === true) {
				return;
			};
		};
		//
		trigger.callback.call(self, ids, {}, function(ids) {
			// call get method to get function data
			func.get('get').call(updateObj, ids, {}, function(docs) {
				// init update data
				var data = {};
				// check multi
				_.each(docs, function(doc, _id) {
					if(func.multi === true) {
						data[_id] = doc[obj.__name];
					} else {
						data[_id] = doc;
					};
				});
				// update
				_.each(data, function(value, _id) {
					var tmp = {};
					tmp[func.__name] = value;
					updateObj.update({
						_id: _id
					}, {
						$set: tmp
					}, {
						noTrigger: true
					});
				});

			});
		});
	});
};

instance.base.model.include({
	init: function() {
		this.___column = this._column;
		this._super.apply(this, arguments);
	},

	__createTrigger: function(ids, args) {
		// call super
		this._super.apply(this, arguments);
		// start trigger
		triggerFunc.call(this, ids, ['_id']);
	},

	__updateTrigger: function(ids, args) {
		// call super function
		this._super.apply(this, arguments);
		// get update fields
		var fields = [];
		_.each(args[1], function(data) {
			_.each(data, function(d, key) {
				fields.push(key.split('.')[0]);
			});
		});
		// start trigger
		triggerFunc.call(this, ids, fields);
	},

	__beforeDelete: function(ids, callback) {// need to query before delete successful.
		var self = this;
		// start trigger
		_.each(triggerCollection[this.__name], function(trigger) {
			var func = trigger.self;
			var updateObj = trigger.updateObj;
			trigger.callback.call(self, ids, {}, function(ids) {
				callback((function(func, self, updateObj, ids) {
					return function() {
						// call get method to get function data
						func.get('get').call(updateObj, ids, {}, function(docs) {
							// init update data
							var data = {};
							// check multi
							_.each(docs, function(doc, _id) {
								if(func.multi === true) {
									data[_id] = doc[obj.__name];
								} else {
									data[_id] = doc;
								};
							});
							// update
							_.each(data, function(value, _id) {
								var tmp = {};
								tmp[func.__name] = value;
								updateObj.update({
									_id: _id
								}, {
									$set: tmp
								}, {
									noTrigger: true
								});
							});
						});
					}
				})(func, self, updateObj, ids));
			});
		});
	}
});
