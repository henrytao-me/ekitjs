// type: func
instance.base.type.func.include({

	init: function(opt) {
		opt === undefined ? opt = {} : null;
		_.mixObject(opt, {
			store: false
		});
		/*
		 * store template
		 * store = true
		 * store = {
		 * 	  'leaderboard.model.player': {
		 * 	     _column: ['name.first', 'score', 'a.$.']
		 *    }
		 * }
		 */
		this._super(opt);
	}
	
	
});

