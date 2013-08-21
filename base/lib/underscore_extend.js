GLOBAL._ = require('underscore');

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
	// vals is Object key => value
	for(var i in vals) {
		// split i
		var keys = i.split('.');
		var tmp = [];
		for(var j in keys) {
			tmp.push(keys[j]);
			if(j < keys.length - 1) {
				var cur = _.getObject(obj, tmp.join('.'));
				if(cur === undefined) {
					try {
						eval('obj.' + tmp.join('.') + ' = {}');
					} catch(ex) {
						return false;
					};
				} else {
					if( typeof cur !== 'object' || force === true) {
						eval('obj.' + tmp.join('.') + ' = {}');
					};
				};
			} else {
				try {
					eval('obj.' + tmp.join('.') + ' = vals[i]');
				} catch(ex) {
					return false;
				};
			};
		};
	};
	return true;
};

/*
 * Extend each function
 * Support: isLast: boolean
 */

_.___each = _.each;
_.each = function(list, iterator, context) {
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
		iterator(value, key, list, {
			index: i - 1,
			isLast: i >= n ? true : false
		});
	};
	_.___each(list, func, context);
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
_.sortObject = function(list, iterator, context){
	if(_.isArray(list)){
		list.sort(function(a, b) {
			return iterator.call(context, a, b);
		});
	}else{
		var new_list = [];
		var type = 'auto';
		_.each(list, function(value, key){
			new_list.push({
				key: key,
				value: value
			});
		});
		_.sortObject(new_list, function(a, b){
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
_.encodeObject = function(object, objKey){
	var res = {};
	(function(res, object, prefix){
		var callback = arguments.callee;
		_.each(object, function(value, key){
			var isObject = false;
			if(_.isObject(value)){
				if(value[objKey] === undefined){
					isObject = true;
				};
			};
			//
			if(isObject === true){
				if(prefix === undefined){
					callback(res, value, key);
				}else{
					callback(res, value, [prefix, key].join('.'));
				};
			}else{
				if(prefix === undefined){
					res[key] = value;
				}else{
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

_.decodeObject = function(object){
	var res = {};
	if(_.setObject(res, object, true) === false){
		return {};
	};
	return res;
};

