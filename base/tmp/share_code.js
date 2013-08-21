(function(root) {
	root.share_code = function(server, client) {
		var is_server = typeof server !== 'undefined' && server.exports ? true : false;
		var res = {
			exports: {},
			share: function() {
				if(is_server) {
					server.exports = res.exports;
				} else {
					if( typeof res.exports === 'function') {
						res.exports(client);
					} else {
						if( typeof client === 'object') {
							for(var i in res.exports) {
								client[i] = res.exports[i];
							};
						};
					};
				};
			}
		};
		return res;
	};
}).call(this, typeof GLOBAL !== 'undefined' ? GLOBAL : this);

