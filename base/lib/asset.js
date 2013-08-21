var fs = require('fs');

var data = {
	css: {
		urls: [],
		files: []
	},
	js: {
		urls: [],
		files: []
	}
};

exports.addUrl = function(type, urls) {
	if( typeof urls !== 'object') {
		urls = [urls];
	};
	for(var i in urls) {
		if(data[type].urls.indexOf(urls[i]) < 0) {
			data[type].urls.push(urls[i]);
		};
	};
};

exports.addFile = function(type, files) {
	if( typeof files !== 'object') {
		files = [files];
	};
	for(var i in files) {
		if(data[type].files.indexOf(files[i]) < 0) {
			data[type].files.push(files[i]);
		};
	};
};

exports.renderTags = function(type) {
	var res = '';
	var urls = '';
	var files = '';
	compress = typeof compress === 'undefined' ? true : compress;
	// urls
	for(var i in data[type].urls) {
		if(type === 'css') {
			urls += '<link href="' + data[type].urls[i] + '" rel="stylesheet" type="text/css">';
		} else if(type === 'js') {
			urls += '<script type="text/javascript" src="' + data[type].urls[i] + '"></script>';
		}
	};
	// files
	for(var i in data[type].files) {
		files += fs.readFileSync(data[type].files[i], 'utf8') + '\n';
	};
	// res
	if(type === 'css') {
		res = urls + '<style type="text/css">' + files + '</style>';
	} else if(type === 'js') {
		res = urls + '<script type="text/javascript">' + files + '</script>';
	}
	return res;
};
