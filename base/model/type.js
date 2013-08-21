module.exports = function(instance) {

	/*
	 * Init type
	 * core type: auto, func, object, array
	 * need to support: string, number, date, datetime, boolean, selection
	 */
	
	instance.base.type = {};

	// type: auto
	instance.base.type.auto = instance.Class.extend({

		opt: {},

		init: function(opt) {
			opt === undefined ? opt = {} : null;
			// init default value
			_.each({
				require: false,
				def: undefined //only effect when require = true
			}, function(value, key) {
				opt[key] === undefined ? opt[key] = value : null;
			});
			// return
			this.opt = opt;
		},

		get: function(key) {
			return this.opt[key];
		},

		checkDataType: function(data) {
			return true;
		},

		validate: function(data) {
			if(this.get('require') === true && data === undefined) {
				if(this.get('def') === undefined) {
					throw {
						msg: 'require value',
						data: data
					};
				} else {
					data = this.get('def');
				};
			};
			if(this.checkDataType(data) !== true) {
				throw {
					msg: 'invalid datatype',
					type: this.__type,
					data: data
				};
			};
			return data;
		}
	});

	// type: func
	instance.base.type.func = instance.base.type.auto.extend({

		init: function(opt) {
			opt === undefined ? opt = {} : null;
			// init default data
			_.each({
				store: false,
				sequence: 10,
				get: function(ids, data, callback) {
					callback();
				},
				set: function() {
				}
			}, function(value, key) {
				opt[key] === undefined ? opt[key] = value : null;
			});
			// return
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

		validate: function(data, type) {
			return undefined;
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

		checkDataType: function(data) {
			if(!(_.isObject(data) === true && _.isArray(data) !== true)) {
				return false;
			};
			for(var i in data) {
				if(this._column[i] === undefined) {
					continue;
				};
				if(this._column[i].checkDataType(data[i]) !== true) {
					return false;
				};
			};
			return true;
		},

		validate: function(data) {
			if(!(_.isObject(data) && !_.isArray(data))) {
				throw {
					msg: 'invalid datatype',
					type: this.__type,
					data: data
				};
			};
			_.each(this._column, function(column, name) {
				data[name] = column.validate(data[name]);
			});
			// remove all undefined data
			_.each(data, function(value, key) {
				if(value === undefined) {
					delete data[key];
				};
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

		checkDataType: function(data) {
			if(!_.isArray(data)) {
				return false;
			};
			for(var i in data) {
				if(this._element.checkDataType(data[i]) !== true) {
					return false;
				};
			};
			return true;
		},

		validate: function(data, type) {
			if(!_.isArray(data)) {
				throw {
					msg: 'invalid datatype',
					type: this.__type,
					data: data
				};
			};
			for(var i in data) {
				data[i] = this._element.validate(data[i]);
			};
			return data;
		}
	});
};
