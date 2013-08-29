instance.base.socket = instance.base.controller.extend({

	init: function() {
		var self = this;

		/* 
		 * collect all instance structure and pass to client
		 * 
		 */
		ekitjs.core_asset.addScript(function() {
			ekitjs.start(ekitjs.data);
		}, {
			instance: this.getInstance(),
			http: 'http://localhost'
		});

		// init socket
		this.initSocket();
	},

	getInstance: function() {
		var res = {};
		var expt = ['*', 'get://', 'post://', 'put://', 'delete://', 'init', 'pool'];
		_.each(_.encodeObject(instance, '__class'), function(__class, key) {
			if(key.indexOf('base.') === 0) {
				return;
			};
			var collection = {};
			var inst = new __class();
			_.each(inst.__keys, function(value, key) {
				if(_.isFunction(inst[key])) {
					var isPass = true;
					_.each(expt, function(e) {
						if(key.indexOf(e) === 0) {
							isPass = false;
						};
					});
					if(isPass === true) {
						collection[key] = true;
					};
				};
			});
			res[key] = collection;
		}, undefined, this);
		return res;
	},

	initSocket: function() {
		var self = this;
		io.sockets.on('connection', function(socket) {
			// listen pool query
			socket.on('socket.client', function(args) {
				self.socketClient(args, function(e, data){
					args.e = e;
					args.data = data;
					socket.emit('socket.server', args);
				});
			});
		});
	},
	
	socketClient: function(args, callback){
		try{
			var tmp = args.args;
			tmp.push(function(e, data){
				callback(e, data);
			});
			var inst = ekitjs.pool(args.instance);
			inst[args.func].apply(inst, tmp);
		}catch(ex){
			callback(true, null);
		};
	}
});

/*
 * inherit model to active sync data
 */
instance.base.model.include({
	createTrigger: function(ids){
		if(ids.length === 0){
			return;
		};
		io.sockets.emit('socket.server.sync', {
			instance: this.__name
		});
		this._super.apply(this, arguments);
	},
	
	updateTrigger: function(ids){
		if(ids.length === 0){
			return;
		};
		io.sockets.emit('socket.server.sync', {
			instance: this.__name
		});
		this._super.apply(this, arguments);
	},
	
	deleteTrigger: function(ids){
		if(ids.length === 0){
			return;
		};
		io.sockets.emit('socket.server.sync', {
			instance: this.__name
		});
		this._super.apply(this, arguments);
	}
});

