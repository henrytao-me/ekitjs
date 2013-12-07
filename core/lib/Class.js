/**
 * Improved John Resig's inheritance, based on:
 *
 * Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 *
 * Adds "include()"
 *
 * Defines The Class object. That object can be used to define and inherit
 * classes using
 * the extend() method.
 *
 * Example:
 *
 * var Person = instance.Class.extend({
 *  init: function(isDancing){
 *     this.dancing = isDancing;
 *   },
 *   dance: function(){
 *     return this.dancing;
 *   }
 * });
 *
 * The init() method act as a constructor. This class can be instancied this way:
 *
 * var person = new Person(true);
 * person.dance();
 *
 * The Person class can also be extended again:
 *
 * var Ninja = Person.extend({
 *   init: function(){
 *     this._super( false );
 *   },
 *   dance: function(){
 *     // Call the inherited version of dance()
 *     return this._super();
 *   },
 *   swingSword: function(){
 *     return true;
 *   }
 * });
 *
 * When extending a class, each re-defined method can use this._super() to call
 * the previous
 * implementation of that method.
 */
(function(instance) {
	var initializing = false,
		fnTest = /xyz/.test(function() {
			xyz;
		}) ? /\b_super\b/ : /.*/;
	// The web Class implementation (does nothing)
	instance.Class = function() {};

	/**
	 * Subclass an existing class
	 *
	 * @param {Object} prop class-level properties (class attributes and instance
	 * methods) to set on the new class
	 */
	instance.Class.extend = function() {
		var _super = this.prototype;
		// Support mixins arguments
		var args = _.toArray(arguments);
		args.unshift({});
		var prop = _.extend.apply(_, args);

		// Instantiate a web class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// ekitjs: init __keys
		prototype.__class = true;
		var tmp = prototype.__keys;
		prototype.__keys = {};
		_.each(tmp, function(value, key) {
			prototype.__keys[key] = value;
		});

		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// add to __keys
			prototype.__keys[name] = prototype.__keys[name] || {};
			prototype.__keys[name].n = (prototype.__keys[name].n || 0) + 1;
			prototype.__keys[name].type = typeof prop[name];

			// Check if we're overwriting an existing function
			prototype[name] = typeof prop[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
				return function() {
					var tmp = this._super;

					// Add a new ._super() method that is the same
					// method but on the super-class
					this._super = _super[name];

					// The method only need to be bound temporarily, so
					// we remove it when we're done executing
					var ret = fn.apply(this, arguments);
					this._super = tmp;

					return ret;
				};
			})(name, prop[name]) : prop[name];
		};

		// The dummy class constructor

		function Class() {
			if (this.constructor !== instance.Class) {
				throw new Error("You can only instanciate objects with the 'new' operator");
				return null;
			};
			// All construction is actually done in the init method
			if (!initializing && this.init) {
				var ret = this.init.apply(this, arguments);
				if (ret) {
					return ret;
				};
			};
			// add self object to each function, ekitjs
			_.each(this.__keys, function(value, key) {
				if (_.isFunction(this[key])) {
					this[key].self = this;
				};
			}, undefined, this);
			// add Class
			this.__Class = Class;
			// 
			return this;
		};

		Class.include = function(properties) {
			for (var name in properties) {
				// add to __keys
				prototype.__keys[name] = prototype.__keys[name] || {};
				prototype.__keys[name].n = (prototype.__keys[name].n || 0) + 1;
				prototype.__keys[name].type = typeof properties[name];
				//
				if (typeof properties[name] !== 'function' || !fnTest.test(properties[name])) {
					prototype[name] = properties[name];
				} else if (typeof prototype[name] === 'function' && prototype.hasOwnProperty(name)) {
					prototype[name] = (function(name, fn, previous) {
						return function() {
							var tmp = this._super;
							this._super = previous;
							var ret = fn.apply(this, arguments);
							this._super = tmp;
							return ret;
						}
					})(name, properties[name], prototype[name]);
				} else if (typeof _super[name] === 'function') {
					prototype[name] = (function(name, fn) {
						return function() {
							var tmp = this._super;
							this._super = _super[name];
							var ret = fn.apply(this, arguments);
							this._super = tmp;
							return ret;
						}
					})(name, properties[name]);
				}
			};
		};

		// Populate our constructed prototype object
		Class.prototype = prototype;

		// Enforce the constructor to be what we expect
		Class.constructor = Class;

		// And make this class extendable
		Class.extend = arguments.callee;

		// ekitjs: dynamic extend
		if (typeof this.extend !== 'undefined') {
			Class.extend = this.extend;
		};
		Class.__class = true;

		// add __keys to Class
		Class.__keys = prototype.__keys;

		return Class;
	};
})(GLOBAL);