var fs = require('fs');
var path = require('path');

exports.subdirs = function(dir) {
	var res = [];
	try {
		var tmp = fs.readdirSync(dir);
		for(var i in tmp) {
			if(fs.lstatSync(path.join(dir, tmp[i])).isDirectory()) {
				res.push(tmp[i]);
			};
		};
	} catch(ex) {
		return res;
	};
	return res;
};
