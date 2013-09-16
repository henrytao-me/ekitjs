var ekit_minify = require('ekit-minify');

instance.base.asset = Class.extend({
	
	data: null,
	cache: {
		css: null,
		js: null
	},

	init: function() {
		this.data = {
			css: {
				urls: [],
				files: []
			},
			js: {
				urls: [],
				files: [],
				scripts: [],
			}
		};
	},

	addUrl: function(type, urls) {
		if( typeof urls !== 'object') {
			urls = [urls];
		};
		for(var i in urls) {
			if(this.data[type].urls.indexOf(urls[i]) < 0) {
				this.data[type].urls.push(urls[i]);
			};
		};
	},

	addFile: function(type, files) {
		if( typeof files !== 'object') {
			files = [files];
		};
		for(var i in files) {
			if(this.data[type].files.indexOf(files[i]) < 0) {
				this.data[type].files.push(files[i]);
			};
		};
	},

	addScript: function(script, data) {
		if( typeof script !== 'function') {
			return;
		};
		this.data.js.scripts.push({
			script: script,
			data: data || {}
		});
	},

	optimize: function(type, content) {
		return ekit_minify.minify({
			ext: '.' + type,
			data: content
		});
	},
	
	render: function(type, val){
		var res = null;
		switch(val){
		case 'urls':
			res = this.data[type][val];
			break;
		case 'files':
			res = '';
			_.each(this.data[type][val], function(file){
				res += fs.readFileSync(file, 'utf8') + '\n';
			});
			if(app.get('env') === 'production') {
				res = this.optimize(type, res);
			};
			break;
		case 'scripts':
			res = '';
			if(type !== 'js'){
				break;
			};
			_.each(this.data[type][val], function(script){
				var entire = script.script.toString();
				res += 'ekitjs.data = ' + JSON.stringify(script.data) + '\n';
				res += entire.substring(entire.indexOf("{") + 1, entire.lastIndexOf("}")) + '\n';
			});
			if(app.get('env') === 'production') {
				res = this.optimize(type, res);
			};
			break;
		default:
			break;
		};
		return res;
	},
	
	renderTags: function(type, val){
		if(this.cache[type] && app.get('env') === 'production'){
			return this.cache[type];
		};
		var res = '';
		// urls
		if(val === 'urls' || val === undefined){
			_.each(this.render(type, 'urls'), function(url){
				if(type === 'css') {
					res += '<link href="' + url + '" rel="stylesheet" type="text/css">';
				} else if(type === 'js') {
					res += '<script type="text/javascript" src="' + url + '"></script>';
				}
			});
		};
		// files
		if(val === 'files' || val === undefined){
			if(type === 'css') {
				res += '<style type="text/css">' + this.render(type, 'files') + '</style>';
			} else if(type === 'js') {
				res += '<script type="text/javascript">' + this.render(type, 'files') + '</script>';
			}
		};
		// scripts
		if((val === 'scripts' || val === undefined) && type === 'js'){
			res += '<script type="text/javascript">' + this.render(type, 'scripts') + '</script>';
		};
		// cache asset
		this.cache[type] = res;
		// return
		return res;
	}
});
