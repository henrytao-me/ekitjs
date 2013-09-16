instance.base.ews = Controller.extend({
	'post://ews': function(req, res, next) {
		var params = req.body;
		_.mixObject(params, {
			instance: '',
			func: '',
			args: []
		});
		var args = _.initCallback(params.args);
		var callback = args.pop();
		args.push(function(e, data) {
			res.send({
				e: e,
				data: data
			});
		});
		try {
			var inst = ekitjs.pool(params.instance);
			inst[params.func].apply(inst, args);
		} catch(ex) {
			res.send({
				e: true,
				data: null
			});
		};
	}
});
