module.exports = {
	name: 'base',
	version: '1.0',
	author: 'Henry Tao',
	contact: 'hi@henrytao.me',
	wesite: 'http://linkedin.com/in/henrytao',
	description: '',
	category: '',

	depends: [],

	css: [
		'http://../static/css/ekitjs.min.css'
	],
	js: [
		'http://../../socket.io/socket.io.js',
		'http://../static/lib/jquery-2.0.3.min.js',
		'http://../static/lib/underscore-min.js',
		'http://../static/js/ekitjs.min.js',
		'/private/ekitjs.init.js',
		'/../core/lib/js_extend.js',
		'/../core/lib/underscore_extend.js',
		'/../core/lib/Class.js',
		'/private/socket.client.js',
		'/private/ekitjs.client.js'
	],

	auto_load: true
};