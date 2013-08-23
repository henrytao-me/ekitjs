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
			var self = this;
			opt === undefined ? opt = {} : null;
			// init default value
			_.each({
				require: false,
				def: undefined // only effect when require = true
			}, function(value, key) {
				opt[key] === undefined ? opt[key] = value : null;
			});
			// init extend validate
			if(_.isFunction(opt.validate)){
				var validate = this.validate;
				this.validate = function(data){
					return opt.validate.call({
						_super: function(data){
							return validate(data);
						}
					}, data);
				};
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
					data = this.get('def');
				};
			};
			return data;
		},

		validate: function(data) {// check data type
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

		require: function(data) {
			return undefined;
		},

		validate: function(data) {
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
};
