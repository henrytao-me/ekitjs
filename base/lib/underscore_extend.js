GLOBAL._ = require('underscore');

/*
 * Extend each function
 * Support: isLast: boolean
 */

_.___each = _.each;
_.each = function(list, iterator, context, self) {
	// extend to check last
	var n = 0;
	var i = 0;
	try {
		if(_.isArray(list)) {
			n = list.length;
		};
		if(_.isObject(list)) {
			n = Object.keys(list).length;
		};
	} catch(ex) {

	};
	var func = function(value, key, list) {
		i++;
		iterator.call(self, value, key, list, {
			index: i - 1,
			isLast: i >= n ? true : false
		});
	};
	_.___each(list, func, context);
};

/*
 * isObject (remove isArray)
 */

_.___isObject = _.isObject;
_.isObject = function(value, excludeArray) {
	if(excludeArray === true) {
		return _.___isObject(value) && !_.isArray(value) ? true : false;
	};
	return _.___isObject(value);
}
/*
 * Get & Set Object
 */

_.getObject = function(obj, key) {
	// key is dot string
	var res = undefined;
	try {
		res = eval('obj.' + key);
	} catch(ex) {
	};
	return res;
};

_.setObject = function(obj, vals, force) {
	force === undefined ? force = false : null;
	try {
		_.each(vals, function(value, keys) {
			(function(obj, keys, value) {
				var first = keys.shift();
				if(keys.length === 0) {
					// if unmatch structure
					if(_.isObject(obj[first]) && !_.isArray(obj[first])) {
						throw {
							func: 'setObject',
							msg: 'unmatch structure'
						};
					};
					// if override
					if(force || obj[first] === undefined) {
						obj[first] = value;
					};
				} else {
					// if obj first is null
					if(obj[first] === undefined) {
						obj[first] = {};
					};
					// if unmatch stucture
					if(!(_.isObject(obj[first]) && !_.isArray(obj[first]))) {
						throw {
							func: 'setObject',
							msg: 'unmatch structure'
						};
					};
					arguments.callee(obj[first], keys, value);
				};
			})(obj, keys.split('.'), value);
		});
	} catch(ex) {
		return false;
	};
	return true;
};

/*
 * Init callback
 */
_.initCallback = function(args, callback) {
	var res = [];
	callback === undefined ? callback = function() {
	} : null;
	try {
		var isHas = false;
		_.each(args, function(value, key, list, opt) {
			res.push(value);
			if(opt.isLast === true && _.isFunction(value) === true) {
				isHas = true;
			};
		});
		if(isHas !== true) {
			res.push(callback);
		};
	} catch(ex) {
	};
	return res;
};

/*
 * sortObject
 *
 * var tmp = [{a: 20}, {a: 10}];
 * tmp = {a: {a: 20}, b: {a: 10}};
 * _.sortObject(tmp, function(a, b){
 * 		return a.a - b.a;
 * });
 * console.log(tmp);
 */
_.sortObject = function(list, iterator, context) {
	if(_.isArray(list)) {
		list.sort(function(a, b) {
			return iterator.call(context, a, b);
		});
	} else {
		var new_list = [];
		var type = 'auto';
		_.each(list, function(value, key) {
			new_list.push({
				key: key,
				value: value
			});
		});
		_.sortObject(new_list, function(a, b) {
			return iterator(a.value, b.value);
		}, context);
		// renew list with new_list
		_.each(list, function(value, key) {
			delete list[key];
		});
		_.each(new_list, function(value) {
			list[value.key] = value.value;
		});
	};
};

/*
 * Encode Object
 * obj = {a: {b: b}, c: c} => obj = {'a.b': b, 'c': c}
 */
_.encodeObject = function(object, objKey) {
	var res = {};
	(function(res, object, prefix) {
		var callback = arguments.callee;
		_.each(object, function(value, key) {
			var isObject = false;
			if(_.isObject(value) && !_.isArray(value)) {
				if(value[objKey] === undefined) {
					isObject = true;
				};
			};
			//
			if(isObject && !_.isArray(value)) {
				if(prefix === undefined) {
					callback(res, value, key);
				} else {
					callback(res, value, [prefix, key].join('.'));
				};
			} else {
				if(prefix === undefined) {
					res[key] = value;
				} else {
					res[[prefix, key].join('.')] = value;
				};
			};
		});
	})(res, object);
	return res;
};

/*
 * Decode Object
 */

_.decodeObject = function(object) {
	var res = {};
	if(_.setObject(res, object) === false) {
		return null;
	};
	return res;
};

/*
 * Success function, deal with multiple callback
 */
_.success = function(n, func, obj) {
	var success = function(n, func, obj) {
		count = 0;
		this.success = function() {
			count++;
			if(count < n){
				return;
			};
			if(_.isFunction(func)){
				func.call(obj);
			};
		};
	};
	return new success(n, func, obj);
};
