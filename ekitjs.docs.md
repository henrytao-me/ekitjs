# ekitJS

A web framework is built on the top of expressjs + mongodb native driver + socket.io, aims to reduce web development lifecycle, effective in collaboration, reusable code, dealing with business logic and support real time sync data from Database to Web Client.

### Start server with a single line of code 
```
require('ekitjs').start(__dirname);
```

### controller.js
```
module.exports = {
	'*': function(req, res, next){
		res.render(path.join(__dirname, '..', 'static', 'view', 'index.html'), {
			css: ekitjs.asset.renderTags('css'),
			js: ekitjs.asset.renderTags('js')
		});
	},
	'get://docs': function(req, res, next){
		// init route for http://127.0.0.1/docs
		res.render(path.join(__dirname, '..', 'static', 'view', 'docs.html'), {
			css: ekitjs.asset.renderTags('css'),
			js: ekitjs.asset.renderTags('js')
		});
	},
	'post://login': function(req, res, next){
		// listen post request from client at the url http://127.0.0.1/login
		res.send('Login successful');
	},
	'put://update_something': function(req, res, next){
		// update something...
		res.send('Update successful');
	},
	'delete://delete_something': function(req, res, next){
		// delete something...
		res.send('Delete successful')
	}
};

```
### model.js
```
module.exports = {
	_name: 'user'
};
```
### Done! Really simple!

# Introduction

ekitJS is a web framework is built on the top of orther basic NodeJS modules like: expressjs, mongo native driver, socket.io, ejs template system... So, it does not require any new coding syntax. What we are doing is re-organize the coding structure and propose the new way to help web development easier, faster and more collaborate. The most important different in ekitJS framework is the balance between the ease of use and the flexibility that the framework can support to help developer dealing with most of the application logic in an very effective way. 

## Five Principles of ekitJS
* **Full Stack Javascript:** It is really awesome when you can use the same language in both server-side and client-side. Then, the code can be reusable.
* **Database Everywhere:** Use the same transparent API to access your database from the client or the server.
* **Everything can be inherit:** We create all models based on the Class which supports extend and include method to help you deal with Object. It is also really easy like JSON. So, most of the time, you can inherit or override everything even ekitjs core class. 
* **Real time webapp via socket.io:** Realtime webapp embeded in the framework is needed now. We give you an option to specify which query want to sync from database and which does not. This is really fantastic. 
* **Module-Based and MVC combine:** We beleive that the MVC model is not enough in collaborate development. We combine the module-based system and MVC inside each module to make the web development more dependent and easier. We call each module as ADDON. The point is that you can inherit or override model in another addon and define dependency list. Again, it is super easy but really awesome.

## What problem we try to solve for you?

Business logic or application logic is the important part in most of application from online shop to product company or even large business. Some of examples are:

* Require value.
* Data validation.
* Function field(*). 
* Create **Invoice** when the **Status** field of **Sale Order** changes. 
* Calculate **Total Price** of **Sale Order Detail** when it changes.
* …

In most of other frameworks, the business logic often is solved in **Controller**. In some case, you may need to duplicate your code. So, the consistency is not 100%.

In NoSQL expecially in MongoDB, the concept is **Free Style Schema**. For us, free style schema does not mean that it does not need schema. For example: NoSQL allow you to define field name in many different ways:

**Option 1:**

```
{
	first_name,
	last_name
}
```

**Option 2:**

```
{
	name: {
		first,
		last
	}
}
```

The point is that after you chose option 1, option 2 or option x, this collection must have the same structure in all document. So, what do you think? Change your mind about what **Free Style Schema** mean deeply or not? You can post your comment about **The Need Of Schema**, even in MongoDB in [Our Gooogle Group](https://groups.google.com/forum/#!forum/ekjtjs).

So, in ekitJS framework, we propose dealing with business logic in Model, rather than in Controller. All business logic can be solve in Model. 100% consistancy, effective and really simple as below:

**Simple require field:**

```
module.exports = {
	_name: 'user',
	_column: {
		name: {
			first: types.auto(),
			last: types.auto(),
		},
		username: types.auto({
			require: true
		})
	}
};
```

**Simple password pre-validate:**

```
module.exports = {
	_name: 'user',
	_column: {
		name: {
			first: types.auto(),
			last: types.auto(),
		},
		username: types.auto({
			require: true
		}),
		password: types.auto({
			validate: function(data) {
				if(data !== undefined) {
					// do some password encryption here
					return 'md5_' + data;
				};
				return data;
			}
		})
	}
};
```

**Simple function field:**

```
module.exports = {
	_name: 'user',
	_column: {
		name: {
			first: types.auto(),
			last: types.auto(),
			full: types.func({
				get: function(ids, data, callback) {
					var res = {};
					this.read({
						_id: {
							$in: ids
						}
					}, function(err, docs) {
						_.each(docs, function(doc) {
							res[doc._id] = [doc.name.first, doc.name.last].join(' ');
						});
						callback(res);
					});
				}
			})
		}
	}
};
```

In the above example, the field **name.full** is always the combination between first name and last name. It will not be stored physically in database. It will be automatically calculated when you make a query. 

**Simple model trigger:**

```
module.exports = {
	_name: 'user',
	_column: {
		name: {
			first: types.auto(),
			last: types.auto()
		}
	},
	createTrigger: function(ids){
		// do some stuff here

		// call parent method
		this._super.apply(arguments);
	},
	updateTrigger: function(ids){
		...
	},
	deleteTrigger: function(ids){
		...
	}
};
```
**Checkout ekitJS API to get more example.**

## Demo
Checkout source code and demo at <https://github.com/henrytao-me/ekitjs-sample>

# Getting started
## Five steps to kick off the ground
1. As with all Node.js modules, first install Node. The Node installer will also install [npm](http://npmjs.org/).
2. Create project folder and install ekitjs package from npm:

		$ mkdir myapp
		$ cd myapp
		$ npm install ekitjs

3. Create app.js to start server with only one single line of code:

	```
	require('ekitjs').start(__dirname);
	```
4. Now, create your first controller index.js to listen request from client:
	
	```
	module.exports = {
		'*': function(req, res, next){
			res.send('Hello world!');
		}
	};
	```
5. Start ekitJS server:

		$ node app.js

Weldone! That is it!

## Starting code structure

	/addons
		/myaddon
			/controller
				index.js
	/node_modules
		/ekitjs
			…
	app.js

## Standard code stucture

	/addons
		/myaddon
			/controller
				index.js
			/model
			/static
				/css
				/js
				/lib
				/view
			index.js
	/node_modules
		/ekitjs
			…
	app.js

## Deployment
As many others nodeJS project, the deployment of ekitJS is the same. You can deploy on Heroku or you own server with no extra effort. 

# Addon

# Model

# View

# Controller

# Socket & Sync Data




# API

## Config file


## GLOBAL Variable
### Server-side

### Client-side


## Base
### instance.base.asset

### instance.base.base

### instance.base.controller

### instance.base.model

### instance.base.socket

### instance.base.type

### instance.base.types


## ekitJS Client




