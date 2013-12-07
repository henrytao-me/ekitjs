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
var waitForSync = false;

instance.base.cFuncStore = instance.base.controller.extend({
	init: function() {
		var self = this;
		// get all model
		_.each(_.encodeObject(instance, '__class'), function(modelClass, key) {
			if(modelClass.__type !== 'model' || key === 'base.model') {
				return;
			};
			// init model, match all _column change by using include method
			var model = ekitjs.pool(key);
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
	},
});

var triggerFunc = function(ids, fields, callback) {
	var self = this;
	// start trigger
	var isStart = false;
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
		isStart = true;
		trigger.callback.call(self, ids, function(ids) {
			// call get method to get function data
			func.get('get').call(updateObj, ids, function(docs) {
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
				if(_.keys(data).length === 0) {
					callback();
				} else {
					var success = _.success(_.keys(data).length, function() {
						callback();
					});
					_.each(data, function(value, _id, l, opt) {
						var tmp = {};
						tmp[func.__name] = value;
						updateObj.update({
							_id: _id
						}, {
							$set: tmp
						}, {
							trigger: false
						}, function(e, d) {
							success.success();
						});
					});
				};
			});
		});
	});
	if(isStart === false){
		callback();
	};
};

instance.base.model.include({
	init: function() {
		this.___column = this._column;
		this._super.apply(this, arguments);
	},

	createTrigger: function(ids, args, callback) {
		// init success function
		var success = (function(self, _super, args) {
			return function() {
				_super.apply(self, args);
			};
		})(this, this._super, arguments);
		// fields
		var fields = ['_id'];
		// call super
		if(waitForSync !== true) {
			success();
		};
		// start trigger
		triggerFunc.call(this, ids, fields, function() {
			// call super if you want to make trigger sequence
			if(waitForSync === true) {
				success();
			};
		});
	},

	updateTrigger: function(ids, args, callback) {
		// init success function
		var success = (function(self, _super, args) {
			return function() {
				_super.apply(self, args);
			};
		})(this, this._super, arguments);
		// init fields
		var fields = [];
		_.each(args[1], function(v, k) {
			_.each(v, function(value, key) {
				fields.push(key.split('.')[0]);
			});
		});
		// call super
		if(waitForSync !== true) {
			success();
		};
		// start trigger
		triggerFunc.call(this, ids, fields, function() {
			// call super if you want to make trigger sequence
			if(waitForSync === true) {
				success();
			};
		});
	},

	deleteTrigger: function(ids, args, callback) {
		// init success function
		var success = (function(self, _super, args) {
			return function() {
				_super.apply(self, args);
			};
		})(this, this._super, arguments);
		// init fields
		var fields = ['_id'];
		triggerFunc.call(this, ids, fields, function() {
			success();
		});
	}
});
