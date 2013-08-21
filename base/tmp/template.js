/*
* share code template
*/

/**************************/

(function(exports) {

	exports.test = function() {
		return 'This is a function from shared module';
	};

}).call(this, typeof exports === 'undefined' ? this.share = {} : exports);

/**************************/

(function(module) {

	module.exports = function(instance) {
	};

	// add this if you want the code can run on client

	if(module.isClient === true) {
		if(!this.ekitjs) {
			this.ekitjs = {};
		};
		module.exports(this.ekitjs);
	};

}).call(this, typeof module !== 'undefined' && module.exports ? module : myVar);

/**************************/

(function(module) {

	module.exports = function(instance) {

	};

	module.share();

}).call(this, share_code(module, this.ekitjs));

/**************************/

//in server
var share = require("./share");

//in client
share.test();
