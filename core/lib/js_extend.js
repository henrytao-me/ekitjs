/*
 * ReplaceAll by Fagner Brack (MIT Licensed)
 * Replaces all occurrences of a substring in a string
 */
String.prototype.replaceAll = function(token, newToken, ignoreCase) {
	var _token;
	var str = this + "";
	var i = -1;

	if( typeof token === "string") {

		if(ignoreCase) {

			_token = token.toLowerCase();

			while(( i = str.toLowerCase().indexOf(token, i >= 0 ? i + newToken.length : 0) ) !== -1) {
				str = str.substring(0, i) + newToken + str.substring(i + token.length);
			}

		} else {
			return this.split(token).join(newToken);
		}

	}
	return str;
};

/*
 * Watch & UnWatch Object change
 *
 */

if(!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		enumerable: false,
		configurable: true,
		writable: false,
		value: function(prop, handler) {
			var oldval = this[prop], newval = oldval, getter = function() {
				return newval;
			}, setter = function(val) {
				oldval = newval;
				return newval = handler.call(this, prop, oldval, val);
			};

			if(
			delete this[prop]) {// can't watch constants
				Object.defineProperty(this, prop, {
					get: getter,
					set: setter,
					enumerable: true,
					configurable: true
				});
			};
		}
	});
};

// object.unwatch
if(!Object.prototype.unwatch) {
	Object.defineProperty(Object.prototype, "unwatch", {
		enumerable: false,
		configurable: true,
		writable: false,
		value: function(prop) {
			var val = this[prop];
			delete this[prop];
			// remove accessors
			this[prop] = val;
		}
	});
};

