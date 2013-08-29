var Socket = Class.extend({

	http: 'http://localhost',
	socket: null,
	
	key: 0,
	
	// callback
	callback: {},
	callbackSync: {},

	init: function(http) {
		var self = this;
		this.http = http;

		// init socket
		this.socket = io.connect(this.http);
		
		this.socket.on('socket.server', function(data) {
			var callback = self.callback[data.key].callback;
			if(_.isFunction(callback)){
				callback(data.e, data.data);	
			};
		});
		
		this.socket.on('socket.server.sync', function(data){
			try{
				_.each(self.callbackSync[data.instance], function(args){
					self.socket.emit('socket.client', {
						type: args.type,
						instance: args.instance,
						func: args.func,
						args: args.args,
						key: args.key
					});
				}, undefined, this);
			}catch(ex){
			};
		});
	},

	getKey: function() {
		return this.key++;
	},

	register: function(args) {
		_.mixObject(args, {
			type: 'pool',
			instance: null,
			func: null,
			args: [],
			key: this.getKey(),
			callback: function() {
			}
		});
		// set key
		this.callback[args.key] = args;
		if(args.type === 'sync'){
			this.callbackSync[args.instance] === undefined ? this.callbackSync[args.instance] = [] : null;
			this.callbackSync[args.instance].push(args);
		};
		this.socket.emit('socket.client', {
			type: args.type,
			instance: args.instance,
			func: args.func,
			args: args.args,
			key: args.key
		});
	}
	
});

