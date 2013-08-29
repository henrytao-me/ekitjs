var ekitjs = Class.extend({

	// server data
	data: null,
	// socket client
	socket: null,
	// instance schema
	instance: {},
	instanceSync: {},

	start: function(opt) {
		
		// init opt default value
		_.mixObject(opt, {
			instance: {},
			http: 'http://localhost'
		});
		
		// init instance for pool & sync
		this.instance = {};
		this.instanceSync = {};
		_.each(_.encodeObject(opt.instance), function(v, key){
			key = key.split('.');
			var func_name = key.pop();
			key = key.join('.');
			
			this.instance[key] === undefined ? this.instance[key] = {} : null;
			this.instanceSync[key] === undefined ? this.instanceSync[key] = {} : null;
			
			this.instance[key][func_name] = true;
			this.instanceSync[key][func_name] = true;
		}, undefined, this);
		
		// init socket
		this.socket = new Socket(opt.http);

		// set instance
		this.setInstance();
	},

	setInstance: function() {
		var self = this;
		// pool
		_.each(this.instance, function(inst, name) {
			_.each(inst, function(v, func) {
				inst[func] = (function(name, func) {
					return function() {
						var args = _.initCallback(arguments);
						// get out callback
						var callback = args.pop();
						self.socket.register({
							type: 'pool',
							instance: name,
							func: func,
							args: args,
							callback: callback
						});
					};
				})(name, func);
			}, undefined, this);
		}, undefined, this);
		
		// sync
		_.each(this.instanceSync, function(inst, name) {
			_.each(inst, function(v, func) {
				inst[func] = (function(name, func) {
					return function() {
						var args = _.initCallback(arguments);
						// get out callback
						var callback = args.pop();
						self.socket.register({
							type: 'sync',
							instance: name,
							func: func,
							args: args,
							callback: callback
						});
					};
				})(name, func);
			}, undefined, this);
		}, undefined, this);
	},

	pool: function(name, func_name) {
		/*
		 * support:
		 * 		ekitjs.pool('sample.model.user', 'read', {}, function(e, data){
					console.log(e, data);
				});
				// and
				ekitjs.pool('sample.model.user').read({}, function(e, data) {
					console.log(e, data);
				});
		 */
		if(func_name !== undefined){
			try{
				var args = _.initCallback(arguments);
				name = args.shift();
				func_name = args.shift();
				this.instance[name][func_name].apply(this.instance[name][func_name], args);
			}catch(ex){
				console.log('pool call error: ', ex);
				console.log(arguments);
			};
			return;
		};
		return this.instance[name];
	},

	sync: function(name, func_name) {
		/*
		 * support:
		 * 		ekitjs.pool('sample.model.user', 'read', {}, function(e, data){
					console.log(e, data);
				});
				// and
				ekitjs.pool('sample.model.user').read({}, function(e, data) {
					console.log(e, data);
				});
		 */
		if(func_name !== undefined){
			try{
				var args = _.initCallback(arguments);
				name = args.shift();
				func_name = args.shift();
				this.instanceSync[name][func_name].apply(this.instanceSync[name][func_name], args);
			}catch(ex){
				console.log('sync call error: ', 'Unknow instance or method',  ex);
				console.log(arguments);
			};
			return;
		};
		return this.instanceSync[name];
	}
});
ekitjs = new ekitjs();

