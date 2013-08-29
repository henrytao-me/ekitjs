# EkitJS

EkitJS - An elegant web framework is built on the top of expressjs + mongodb native driver + more..., aims to reduce web development lifecycle, effective in collaboration, reusable code and real time sync data from DB to Client. 

## Current Stage: 
* Developing. 

## Principle & Term

EkitJS is a web framework is built on the top of orther basic NodeJS modules. So, it does not require any new coding syntax. What we are doing is reorganize the coding structure and propose the new way to help web development easier, faster and more collaborate. The mind-set is really important. Here are list of things you need to keep in mind before starting with EkitJS (Dont's worry, it is pretty easy!):

1. By default: EkitJS = expressJS + ejs + ekit-dir + mongodb + underscore + (mind-set).
2. EkitJS is the combination between Module-Based and MVC Model. This means we have the module on the top of the application. In each module, we have MVC Model. 
3. Using Class in Javascript most of the time. We extend the Class from here: <http://ejohn.org/blog/simple-javascript-inheritance/>.
4. Everything (mostly) can be inherited, extended (Controller & Model).
5. Checkout [MongoDB Query Syntax](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html).

## Functionality

* Support Schema Design in MongoDB based on defining Model.
* Support auto check requirement field, data validation.
* Support function field (trigger later). 
* Real time stream and broadcast data from DB to Client using web socket. Inspired by Meteor & Derby concept.
* Support all other NodeJS module on npm.

## Requirements

* Mongodb instance.
* Read the readme.

## Installation

1. In your package.json, add dependencies:

		"dependencies": {
			"ekitjs": "*"
		}

2. Download the package, using: 
	
		npm update

3. Go to node_modules/ekitjs, copy config.json to your web application root folder.

4. In your start script app.js, add single line of code to get start: 

		require('ekitjs').start(__dirname);

5. Done! Enjoy! 

**Noted:** open the config.json file in your web application root folder and change some parameters that are suitable with your machine. 

## Demo Source Code

Download demo source code at: <https://github.com/henrytao-me/ekitjs-sample>